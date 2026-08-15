import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/Popover';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/utils/cn';

import styles from './Combobox.module.css';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type ComboboxOptions =
  readonly ComboboxOption[] | ((query: string) => Promise<readonly ComboboxOption[]>);

export interface ComboboxProps {
  /** Accessible label for the combobox input. */
  label: string;
  /** Static options, or an async loader that resolves options for the current query. */
  options: ComboboxOptions;
  /** Selected option value(s). Always an array: 0/1 entries in single mode, any number in multiple mode. */
  value: readonly string[];
  onValueChange: (value: readonly string[]) => void;
  /** Multi-select mode: selections render as removable tags and the list stays open. */
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Show a clear button when a value is selected. */
  clearable?: boolean;
  /** External validation error shown on the input. */
  error?: string;
  /** Message shown while an async loader is running. */
  loadingText?: string;
  /** Message shown when no options match the query. */
  emptyText?: string;
}

const DEFAULT_LOAD_ERROR = 'Failed to load options. Please try again.';
const DEBOUNCE_MS = 200;

/**
 * Accessible autocomplete/combobox (WAI-ARIA combobox pattern): a
 * `role="combobox"` input wired to a `role="listbox"` via
 * `aria-activedescendant`, built on the Popover primitive. Supports keyboard
 * navigation (↑ ↓ Home End Enter Escape Tab), client-side typeahead filtering,
 * an async option loader (race-safe, debounced) with loading/error/empty
 * states, disabled options, single or multi selection, and a clear button.
 */
export function Combobox({
  label,
  options,
  value,
  onValueChange,
  multiple = false,
  placeholder,
  disabled = false,
  clearable = false,
  error,
  loadingText = 'Loading options…',
  emptyText = 'No options match.',
}: ComboboxProps) {
  const isAsync = typeof options === 'function';
  const loader = isAsync ? options : undefined;

  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [resolved, setResolved] = useState<readonly ComboboxOption[] | null>(null);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const loaderRef = useRef(loader);
  const reopenOnFocusRef = useRef(true);
  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const listboxId = useId();
  const optionBaseId = useId();
  const describedById = useId();

  const allOptions = useMemo(
    () => (isAsync ? (resolved ?? []) : options),
    [isAsync, resolved, options],
  );
  const optionMap = useMemo(() => {
    const map = new Map<string, ComboboxOption>();
    for (const option of allOptions) {
      map.set(option.value, option);
    }
    return map;
  }, [allOptions]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (normalizedQuery === '') {
      return allOptions;
    }
    return allOptions.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [allOptions, normalizedQuery]);

  const filteredKey = filtered.map((option) => option.value).join('\u0000');

  // Reset the active option to the first enabled match whenever the visible
  // list changes (adjust-state-during-render; the effect-based alternative is
  // rejected by react-hooks/set-state-in-effect).
  const [prevFilteredKey, setPrevFilteredKey] = useState<string>('');
  if (filteredKey !== prevFilteredKey) {
    setPrevFilteredKey(filteredKey);
    setHighlightedIndex(filtered.findIndex((option) => !option.disabled));
  }

  // Debounced, race-safe async loading. State updates happen inside the timer
  // callback / promise (async context), not synchronously in the effect body.
  // The loader is read from a ref so inline (unstable-identity) loaders do not
  // re-trigger the effect on every render.
  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (currentLoader === undefined || !open) {
      return;
    }
    const id = ++requestIdRef.current;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setLoadError(undefined);
        try {
          const result = await currentLoader(query);
          if (id !== requestIdRef.current) {
            return;
          }
          setResolved(result);
        } catch (cause) {
          if (id !== requestIdRef.current) {
            return;
          }
          setLoadError(
            cause instanceof Error && cause.message !== '' ? cause.message : DEFAULT_LOAD_ERROR,
          );
        } finally {
          if (id === requestIdRef.current) {
            setLoading(false);
          }
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open, query]);

  const labelFor = (optionValue: string): string =>
    optionMap.get(optionValue)?.label ?? optionValue;

  const selectOption = (option: ComboboxOption) => {
    if (option.disabled) {
      return;
    }
    if (multiple) {
      onValueChange(
        value.includes(option.value)
          ? value.filter((current) => current !== option.value)
          : [...value, option.value],
      );
      setQuery('');
      reopenOnFocusRef.current = true;
    } else {
      onValueChange([option.value]);
      setQuery(option.label);
      setOpen(false);
      reopenOnFocusRef.current = false;
    }
    inputRef.current?.focus();
  };

  const clear = () => {
    onValueChange([]);
    setQuery('');
    inputRef.current?.focus();
  };

  const moveHighlight = (delta: number) => {
    const enabledIndices = filtered
      .map((option, index) => ({ option, index }))
      .filter((entry) => !entry.option.disabled);
    if (enabledIndices.length === 0) {
      return;
    }
    const position = enabledIndices.findIndex((entry) => entry.index === highlightedIndex);
    const next = enabledIndices[(position + delta + enabledIndices.length) % enabledIndices.length];
    setHighlightedIndex(next?.index ?? -1);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setOpen(true);
        moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveHighlight(-1);
        break;
      case 'Home':
        event.preventDefault();
        setHighlightedIndex(filtered.findIndex((option) => !option.disabled));
        break;
      case 'End': {
        event.preventDefault();
        let lastEnabled = -1;
        for (let i = filtered.length - 1; i >= 0; i -= 1) {
          const option = filtered[i];
          if (option !== undefined && !option.disabled) {
            lastEnabled = i;
            break;
          }
        }
        setHighlightedIndex(lastEnabled);
        break;
      }
      case 'Enter': {
        const option = filtered[highlightedIndex];
        if (option !== undefined && !option.disabled) {
          event.preventDefault();
          selectOption(option);
        }
        break;
      }
      case 'Escape':
        // Radix closes the popover; also revert the query to the selection.
        setOpen(false);
        setQuery(multiple ? query : labelFor(value[0] ?? ''));
        break;
      default:
        break;
    }
  };

  const activeOptionId =
    open && filtered[highlightedIndex] !== undefined
      ? `${optionBaseId}-${highlightedIndex}`
      : undefined;

  // When focused, show the query; the query starts empty so an existing
  // selection's label is shown until the user types. When blurred, always
  // fall back to the selection label.
  const inputValue = multiple
    ? query
    : focused
      ? query !== ''
        ? query
        : labelFor(value[0] ?? '')
      : labelFor(value[0] ?? '');

  const onFocus = () => {
    setFocused(true);
    if (reopenOnFocusRef.current) {
      setOpen(true);
    }
    reopenOnFocusRef.current = true;
  };

  const onBlur = () => {
    setFocused(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setFocused(false);
        }
      }}
    >
      <PopoverAnchor asChild>
        <div ref={anchorRef} className={cn(styles.anchor, disabled && styles.disabled)}>
          {multiple && value.length > 0 && (
            <div className={styles.tags}>
              {value.map((optionValue) => (
                <span key={optionValue} className={styles.tag}>
                  {labelFor(optionValue)}
                  <button
                    type="button"
                    className={styles.tagRemove}
                    aria-label={`Remove ${labelFor(optionValue)}`}
                    onClick={() => {
                      onValueChange(value.filter((current) => current !== optionValue));
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className={styles.inputWrap}>
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-label={label}
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeOptionId}
              aria-invalid={error !== undefined || undefined}
              aria-describedby={error !== undefined ? describedById : undefined}
              value={inputValue}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                styles.input,
                error !== undefined && styles.invalid,
                (loading || (clearable && value.length > 0)) && styles.inputWithActions,
              )}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={onKeyDown}
            />
            {(loading || (clearable && value.length > 0 && !disabled)) && (
              <div className={styles.actions}>
                {loading && <Spinner size="sm" aria-hidden="true" />}
                {clearable && value.length > 0 && !disabled && (
                  <button
                    type="button"
                    className={styles.clear}
                    aria-label="Clear selection"
                    onClick={clear}
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverAnchor>

      {error !== undefined && (
        <p id={describedById} role="alert" className={styles.fieldError}>
          {error}
        </p>
      )}

      <PopoverContent
        aria-label={label}
        className={styles.listbox}
        align="start"
        sideOffset={4}
        showArrow={false}
        onPointerDownOutside={(event) => {
          // The input lives inside the anchor, which Radix treats as "outside"
          // the content; ignore dismissals that originate from the anchor so
          // clicking/focusing the input keeps the list open.
          const target = event.detail.originalEvent.target;
          if (target instanceof Node && anchorRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          // Focus returning to the anchor's input (e.g. after selecting an
          // option) must not close the list.
          const target = event.target;
          if (target instanceof Node && anchorRef.current?.contains(target)) {
            event.preventDefault();
          }
        }}
        onOpenAutoFocus={(event) => {
          // Keep focus in the input so typing filters the list.
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        {loading ? (
          <div role="status" className={styles.status}>
            {loadingText}
          </div>
        ) : loadError !== undefined ? (
          <div role="alert" className={styles.errorText}>
            {loadError}
          </div>
        ) : filtered.length === 0 ? (
          <div role="status" className={styles.status}>
            {emptyText}
          </div>
        ) : (
          <ul id={listboxId} role="listbox" aria-label={label} className={styles.list}>
            {filtered.map((option, index) => (
              // Keyboard interaction is provided by the combobox input via
              // aria-activedescendant; options themselves are non-focusable.
              /* eslint-disable-next-line jsx-a11y/click-events-have-key-events */
              <li
                key={option.value}
                id={`${optionBaseId}-${index}`}
                role="option"
                aria-selected={value.includes(option.value)}
                aria-disabled={option.disabled || undefined}
                className={cn(
                  styles.option,
                  index === highlightedIndex && styles.active,
                  value.includes(option.value) && styles.selected,
                  option.disabled && styles.optionDisabled,
                )}
                onClick={() => {
                  selectOption(option);
                }}
                onMouseEnter={() => {
                  if (!option.disabled) {
                    setHighlightedIndex(index);
                  }
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
