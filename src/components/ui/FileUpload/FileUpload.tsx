import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { announce } from '@/lib/accessibility/liveRegion';
import { cn } from '@/utils/cn';

import styles from './FileUpload.module.css';

export type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface FileUploadItem {
  /** Stable identifier for the entry. */
  id: string;
  file: File;
  status: FileUploadStatus;
  /** Upload progress as a percentage (0–100). */
  progress: number;
  /** Human-readable error message when `status === 'error'`. */
  error?: string;
}

export interface RejectedFileItem {
  id: string;
  file: File;
  /** Validation failures, e.g. unsupported type or size limit exceeded. */
  errors: string[];
}

export interface UploadCallbacks {
  /** Report upload progress as a percentage (0–100). */
  onProgress: (percent: number) => void;
  /** Fires when the user cancels the upload; the uploader should abort. */
  signal: AbortSignal;
}

export type FileUploadHandler = (file: File, callbacks: UploadCallbacks) => Promise<void>;

export interface FileUploadProps {
  /** Kind of file expected; used in the drop-zone prompt. */
  label: string;
  /** Helpful text shown below the drop zone. */
  hint?: string;
  /** `accept` attribute passed to the picker (e.g. "image/*,.pdf") — also used for validation. */
  accept?: string;
  /** Files larger than this many bytes are rejected. */
  maxSizeBytes?: number;
  /** Allow more than one file. Defaults to false. */
  multiple?: boolean;
  /** Disable the picker, drop zone and per-file actions. */
  disabled?: boolean;
  /** Start uploading each file as soon as it is added. Defaults to true. */
  autoUpload?: boolean;
  /**
   * Upload function supplied by the consumer (never hard-coded). Receives the
   * file plus callbacks for progress reporting and cancellation. When omitted
   * the component acts as a picker and accepted files are marked ready.
   */
  onUpload?: FileUploadHandler;
  /** Called with the current accepted items whenever the list changes. */
  onItemsChange?: (items: readonly FileUploadItem[]) => void;
  /** External validation error rendered below the drop zone. */
  error?: string;
  browseLabel?: string;
  uploadLabel?: string;
  cancelLabel?: string;
  retryLabel?: string;
  removeLabel?: string;
}

const PENDING_LABEL = 'Waiting to upload';
const DONE_LABEL = 'Uploaded';
const ERROR_LABEL = 'Upload failed';
const FAILED_MESSAGE = 'Upload failed. Please try again.';

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const unit = units[unitIndex] ?? 'KB';
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${unit}`;
}

/** Best-effort match of a file against an `accept` string (MIME, MIME wildcard or extension). */
function matchesAccept(file: File, accept: string | undefined): boolean {
  if (accept === undefined || accept.trim() === '') {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token !== '')
    .some((token) => {
      if (token.startsWith('.')) {
        return name.endsWith(token.toLowerCase());
      }
      if (token.endsWith('/*')) {
        return type.startsWith(token.slice(0, -1).toLowerCase());
      }
      return type === token.toLowerCase();
    });
}

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

/**
 * Accessible file-upload primitive: a native `input[type="file"]` (visually
 * hidden, opened by a labelled drop zone) plus a drag & drop zone. Accepts an
 * optional consumer-supplied upload function, separates validation from the
 * upload lifecycle, reports progress, supports cancel/retry/remove, and
 * announces meaningful state changes to screen readers.
 */
export function FileUpload({
  label,
  hint,
  accept,
  maxSizeBytes,
  multiple = false,
  disabled = false,
  autoUpload = true,
  onUpload,
  onItemsChange,
  error,
  browseLabel = 'browse',
  uploadLabel = 'Upload',
  cancelLabel = 'Cancel',
  retryLabel = 'Retry',
  removeLabel = 'Remove',
}: FileUploadProps) {
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [rejected, setRejected] = useState<RejectedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const itemsRef = useRef<FileUploadItem[]>([]);
  const rejectedRef = useRef<RejectedFileItem[]>([]);
  const controllersRef = useRef(new Map<string, AbortController>());
  const dragDepthRef = useRef(0);
  const idCounterRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const onItemsChangeRef = useRef(onItemsChange);

  useEffect(() => {
    onItemsChangeRef.current = onItemsChange;
  }, [onItemsChange]);

  // Abort any in-flight uploads when the component unmounts.
  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      for (const controller of controllers.values()) {
        controller.abort();
      }
      controllers.clear();
    };
  }, []);

  const errorId = useId();
  const hintId = useId();
  const describedById = error !== undefined ? errorId : hint !== undefined ? hintId : undefined;

  const commitItems = (next: FileUploadItem[]): void => {
    itemsRef.current = next;
    setItems(next);
    onItemsChangeRef.current?.(next);
  };

  const commitRejected = (next: RejectedFileItem[]): void => {
    rejectedRef.current = next;
    setRejected(next);
  };

  const nextId = (): string => {
    idCounterRef.current += 1;
    return `file-${idCounterRef.current}`;
  };

  type ItemPatch = Omit<Partial<FileUploadItem>, 'error'> & { error?: string | null };

  const updateItem = (id: string, patch: ItemPatch): void => {
    commitItems(
      itemsRef.current.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }
        const next: FileUploadItem = {
          id: entry.id,
          file: entry.file,
          status: patch.status ?? entry.status,
          progress: patch.progress ?? entry.progress,
        };
        if (patch.error !== undefined && patch.error !== null) {
          next.error = patch.error;
        } else if (patch.error === null) {
          delete next.error;
        }
        return next;
      }),
    );
  };

  const startUpload = (id: string): void => {
    const upload = onUpload;
    const entry = itemsRef.current.find((item) => item.id === id);
    if (upload === undefined || entry === undefined || entry.status === 'uploading') {
      return;
    }
    const controller = new AbortController();
    controllersRef.current.set(id, controller);
    updateItem(id, { status: 'uploading', progress: 0, error: null });
    announce(`Uploading ${entry.file.name}…`);
    void (async () => {
      try {
        await upload(entry.file, {
          onProgress: (percent) => {
            if (!controller.signal.aborted) {
              updateItem(id, { progress: clampPercent(percent) });
            }
          },
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          if (itemsRef.current.some((item) => item.id === id)) {
            updateItem(id, { status: 'pending', progress: 0, error: null });
          }
          return;
        }
        if (itemsRef.current.some((item) => item.id === id)) {
          updateItem(id, { status: 'done', progress: 100, error: null });
          announce(`Uploaded ${entry.file.name}`);
        }
      } catch (cause) {
        if (itemsRef.current.some((item) => item.id === id)) {
          if (controller.signal.aborted) {
            updateItem(id, { status: 'pending', progress: 0, error: null });
          } else {
            updateItem(id, {
              status: 'error',
              progress: 0,
              error:
                cause instanceof Error && cause.message !== '' ? cause.message : FAILED_MESSAGE,
            });
          }
          announce(
            controller.signal.aborted
              ? `Cancelled upload of ${entry.file.name}`
              : `Failed to upload ${entry.file.name}`,
          );
        }
      } finally {
        controllersRef.current.delete(id);
      }
    })();
  };

  const cancelUpload = (id: string): void => {
    const controller = controllersRef.current.get(id);
    if (controller === undefined) {
      return;
    }
    controller.abort();
    // Optimistically return the file to a retryable state. The in-flight
    // handler is expected to settle once aborted; its continuation treats the
    // already-aborted controller as a no-op (updateItem is idempotent).
    updateItem(id, { status: 'pending', progress: 0, error: null });
  };

  const removeItem = (id: string): void => {
    const entry = itemsRef.current.find((item) => item.id === id);
    if (entry === undefined) {
      return;
    }
    const controller = controllersRef.current.get(id);
    if (controller !== undefined) {
      controller.abort();
      controllersRef.current.delete(id);
    }
    commitItems(itemsRef.current.filter((item) => item.id !== id));
    announce(`Removed ${entry.file.name}`);
  };

  const dismissRejected = (id: string): void => {
    commitRejected(rejectedRef.current.filter((entry) => entry.id !== id));
  };

  const addFiles = (incoming: readonly File[]): void => {
    if (disabled || incoming.length === 0) {
      return;
    }
    const accepted: FileUploadItem[] = [];
    const invalid: RejectedFileItem[] = [];

    for (const file of incoming) {
      const errors: string[] = [];
      if (!matchesAccept(file, accept)) {
        errors.push(`File type not allowed. Accepted: ${accept}.`);
      }
      if (maxSizeBytes !== undefined && file.size > maxSizeBytes) {
        errors.push(`File is larger than ${formatBytes(maxSizeBytes)}.`);
      }
      const duplicate =
        itemsRef.current.some((entry) => entry.file.name === file.name) ||
        rejectedRef.current.some((entry) => entry.file.name === file.name);
      if (duplicate) {
        errors.push('A file with this name is already added.');
      }
      if (!multiple && (itemsRef.current.length > 0 || accepted.length > 0)) {
        errors.push('Only one file can be added.');
      }
      if (errors.length > 0) {
        invalid.push({ id: nextId(), file, errors });
      } else {
        accepted.push({
          id: nextId(),
          file,
          status: onUpload === undefined ? 'done' : 'pending',
          progress: onUpload === undefined ? 100 : 0,
        });
      }
    }

    if (invalid.length > 0) {
      commitRejected([...rejectedRef.current, ...invalid]);
      const firstName = invalid[0];
      announce(
        invalid.length === 1 && firstName !== undefined
          ? `Rejected ${firstName.file.name}: ${firstName.errors[0] ?? 'invalid file'}`
          : `Rejected ${invalid.length} files`,
      );
    }
    if (accepted.length > 0) {
      commitItems([...itemsRef.current, ...accepted]);
      if (autoUpload && onUpload !== undefined) {
        for (const entry of accepted) {
          startUpload(entry.id);
        }
      }
    }
  };

  const openPicker = (): void => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>): void => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>): void => {
    if (disabled) {
      return;
    }
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer?.files ?? []));
  };

  const statusLabel = (item: FileUploadItem): string => {
    switch (item.status) {
      case 'pending':
        return PENDING_LABEL;
      case 'uploading':
        return `${Math.round(item.progress)}%`;
      case 'done':
        return DONE_LABEL;
      case 'error':
        return ERROR_LABEL;
    }
  };

  const constraintsHint = useMemo(() => {
    const parts: string[] = [];
    if (accept !== undefined && accept.trim() !== '') {
      parts.push(
        accept
          .split(',')
          .map((token) => token.trim().replace(/^\./, '').toUpperCase())
          .filter((token) => token !== '')
          .join(', '),
      );
    }
    if (maxSizeBytes !== undefined) {
      parts.push(`Up to ${formatBytes(maxSizeBytes)}`);
    }
    return parts.join(' · ');
  }, [accept, maxSizeBytes]);

  return (
    <div className={styles.root}>
      <input
        ref={inputRef}
        type="file"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        multiple={multiple}
        disabled={disabled}
        {...(accept !== undefined && { accept })}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          addFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={describedById}
        className={cn(styles.dropZone, isDragging && styles.dragging, disabled && styles.disabled)}
        onClick={() => {
          openPicker();
        }}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className={styles.dropIcon} aria-hidden="true">
          ↑
        </span>
        <p className={styles.dropText}>
          Drag &amp; drop {label} here, or <span className={styles.browse}>{browseLabel}</span>
        </p>
        {constraintsHint !== '' && <p className={styles.dropHint}>{constraintsHint}</p>}
      </div>

      {error !== undefined && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {hint !== undefined && error === undefined && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}

      {rejected.length > 0 && (
        <ul className={styles.rejected} aria-label="Rejected files">
          {rejected.map((entry) => (
            <li key={entry.id} className={styles.rejectedItem}>
              <div className={styles.rejectedInfo}>
                <span className={styles.rejectedName}>{entry.file.name}</span>
                <p className={styles.rejectedErrors}>{entry.errors.join(' ')}</p>
              </div>
              <IconButton
                aria-label={`Dismiss ${entry.file.name}`}
                variant="ghost"
                size="sm"
                className={styles.rejectedRemove}
                onClick={() => {
                  dismissRejected(entry.id);
                }}
              >
                <span aria-hidden="true">✕</span>
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <div className={styles.itemMain}>
                <span className={styles.fileName}>{item.file.name}</span>
                <span className={styles.fileMeta}>{formatBytes(item.file.size)}</span>
                <span className={styles.fileMeta}>{statusLabel(item)}</span>
                {item.status === 'uploading' && (
                  <progress
                    className={styles.progress}
                    max={100}
                    value={Math.round(item.progress)}
                    aria-label={`Upload progress for ${item.file.name}`}
                    aria-valuenow={Math.round(item.progress)}
                  />
                )}
                {item.status === 'error' && item.error !== undefined && (
                  <p className={styles.itemError} role="alert">
                    {item.error}
                  </p>
                )}
              </div>
              <div className={styles.itemActions}>
                {item.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      startUpload(item.id);
                    }}
                  >
                    {uploadLabel}
                  </Button>
                )}
                {item.status === 'uploading' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      cancelUpload(item.id);
                    }}
                  >
                    {cancelLabel}
                  </Button>
                )}
                {item.status === 'error' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      startUpload(item.id);
                    }}
                  >
                    {retryLabel}
                  </Button>
                )}
                <IconButton
                  aria-label={`${removeLabel} ${item.file.name}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    removeItem(item.id);
                  }}
                >
                  <span aria-hidden="true">✕</span>
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
