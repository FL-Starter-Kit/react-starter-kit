import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  FileUpload,
  type FileUploadHandler,
  type FileUploadItem,
  type FileUploadProps,
} from '@/components/ui/FileUpload';

interface HarnessProps extends Partial<Omit<FileUploadProps, 'onUpload' | 'onItemsChange'>> {
  onUpload?: FileUploadHandler;
  onItemsChange?: (items: readonly FileUploadItem[]) => void;
}

function Harness({ onUpload, onItemsChange, ...props }: HarnessProps) {
  return (
    <FileUpload
      label="documents"
      {...(onUpload !== undefined && { onUpload })}
      {...(onItemsChange !== undefined && { onItemsChange })}
      {...props}
    />
  );
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (input === null) {
    throw new Error('File input not rendered');
  }
  return input;
}

function makeFile(name: string, type = 'text/plain', size = 10): File {
  return new File([new ArrayBuffer(size)], name, { type });
}

function liveRegionText(): string | null {
  return document.querySelector('.sr-only-live-region')?.textContent ?? null;
}

const dropZone = (): HTMLElement => screen.getByRole('button', { name: /drag & drop documents/i });

// Scope rejected-list assertions to the visible list: the live region mirrors
// the rejection message, so unscoped text queries can match both.
const rejectedList = (): HTMLElement => screen.getByLabelText('Rejected files');

describe('FileUpload', () => {
  it('renders a labelled drop zone with a hidden picker input', () => {
    const { container } = render(<Harness />);
    expect(dropZone()).toBeInTheDocument();
    const input = getFileInput(container);
    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('tabindex', '-1');
    expect(dropZone()).not.toHaveAttribute('aria-disabled');
  });

  it('accepts a file when no upload handler is set (picker mode)', async () => {
    const { container } = render(<Harness />);
    await userEvent.upload(getFileInput(container), makeFile('notes.txt'));

    expect(await screen.findByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByText('10 B')).toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
  });

  it('opens the picker when the drop zone is activated with Enter or Space', async () => {
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<Harness />);

    dropZone().focus();
    await user.keyboard('{Enter}');
    expect(clickSpy).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(clickSpy).toHaveBeenCalledTimes(2);
    clickSpy.mockRestore();
  });

  it('uploads automatically when a handler is provided and marks the file done', async () => {
    const upload = vi.fn<FileUploadHandler>().mockResolvedValue(undefined);
    const { container } = render(<Harness onUpload={upload} />);

    await userEvent.upload(getFileInput(container), makeFile('report.pdf', 'application/pdf'));
    await waitFor(() => {
      expect(upload).toHaveBeenCalledTimes(1);
    });

    const firstCall = upload.mock.calls[0];
    expect(firstCall?.[0].name).toBe('report.pdf');
    expect(typeof firstCall?.[1].onProgress).toBe('function');
    expect(firstCall?.[1].signal).toBeInstanceOf(AbortSignal);
    expect(await screen.findByText('Uploaded')).toBeInTheDocument();
  });

  it('does not upload when autoUpload is disabled, then uploads on demand', async () => {
    const upload = vi.fn<FileUploadHandler>().mockResolvedValue(undefined);
    const { container } = render(<Harness onUpload={upload} autoUpload={false} />);

    await userEvent.upload(getFileInput(container), makeFile('notes.txt'));
    expect(upload).not.toHaveBeenCalled();
    expect(screen.getByText('Waiting to upload')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await waitFor(() => {
      expect(upload).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('Uploaded')).toBeInTheDocument();
  });

  it('reports upload progress via the progressbar', async () => {
    let resolveUpload: (() => void) | undefined;
    const upload = vi.fn<FileUploadHandler>(async (_file, callbacks) => {
      callbacks.onProgress(40);
      await new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });
    });
    const { container } = render(<Harness onUpload={upload} />);

    await userEvent.upload(getFileInput(container), makeFile('photo.jpg', 'image/jpeg'));
    const progress = await screen.findByRole('progressbar');
    expect(progress).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('40%')).toBeInTheDocument();

    resolveUpload?.();
    await screen.findByText('Uploaded');
  });

  it('cancels an in-flight upload and returns the file to a retryable state', async () => {
    const abortListener = vi.fn();
    let resolveUpload: (() => void) | undefined;
    const upload = vi.fn<FileUploadHandler>(async (_file, callbacks) => {
      callbacks.signal.addEventListener('abort', abortListener);
      await new Promise<void>((resolve) => {
        resolveUpload = resolve;
      });
    });
    const { container } = render(<Harness onUpload={upload} />);

    await userEvent.upload(getFileInput(container), makeFile('video.mp4', 'video/mp4'));
    await screen.findByRole('progressbar');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(abortListener).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('button', { name: 'Upload' })).toBeInTheDocument();
    expect(screen.getByText('Waiting to upload')).toBeInTheDocument();

    resolveUpload?.();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });

  it('surfaces an upload error and offers retry', async () => {
    const upload = vi
      .fn<FileUploadHandler>()
      .mockRejectedValue(new Error('Server rejected the file'));
    const { container } = render(<Harness onUpload={upload} />);

    await userEvent.upload(getFileInput(container), makeFile('bad.txt'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Server rejected the file');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByText('Upload failed')).toBeInTheDocument();
  });

  it('retries a failed upload when Retry is clicked', async () => {
    const upload = vi
      .fn<FileUploadHandler>()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce(undefined);
    const { container } = render(<Harness onUpload={upload} />);

    await userEvent.upload(getFileInput(container), makeFile('bad.txt'));
    await screen.findByRole('alert');

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => {
      expect(upload).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('Uploaded')).toBeInTheDocument();
  });

  it('removes an uploaded file', async () => {
    const { container } = render(<Harness />);
    await userEvent.upload(getFileInput(container), makeFile('notes.txt'));
    await screen.findByText('notes.txt');

    await userEvent.click(screen.getByRole('button', { name: 'Remove notes.txt' }));
    expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
  });

  it('rejects files that do not match the accept attribute', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<Harness accept=".pdf,image/png" />);
    await user.upload(getFileInput(container), makeFile('notes.txt', 'text/plain'));

    expect(await screen.findByText('notes.txt')).toBeInTheDocument();
    expect(within(rejectedList()).getByText(/file type not allowed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss notes.txt' })).toBeInTheDocument();
  });

  it('rejects files larger than maxSizeBytes', async () => {
    const { container } = render(<Harness maxSizeBytes={5} />);
    await userEvent.upload(
      getFileInput(container),
      makeFile('big.bin', 'application/octet-stream', 10),
    );

    expect(await within(rejectedList()).findByText(/larger than 5 B/i)).toBeInTheDocument();
  });

  it('dismisses a rejected file', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<Harness accept="image/png" />);
    await user.upload(getFileInput(container), makeFile('a.txt', 'text/plain'));
    await within(rejectedList()).findByText(/file type not allowed/i);

    await user.click(screen.getByRole('button', { name: 'Dismiss a.txt' }));
    expect(screen.queryByText('a.txt')).not.toBeInTheDocument();
  });

  it('rejects a duplicate file name', async () => {
    const { container } = render(<Harness />);
    const input = getFileInput(container);
    await userEvent.upload(input, makeFile('a.txt'));
    await screen.findByText('a.txt');

    await userEvent.upload(input, makeFile('a.txt'));
    expect(await within(rejectedList()).findByText(/already added/i)).toBeInTheDocument();
  });

  it('accepts multiple files when multiple is set', async () => {
    const { container } = render(<Harness multiple />);
    await userEvent.upload(getFileInput(container), [makeFile('a.txt'), makeFile('b.txt')]);

    expect(await screen.findByText('a.txt')).toBeInTheDocument();
    expect(screen.getByText('b.txt')).toBeInTheDocument();
    expect(screen.queryByText(/only one file/i)).not.toBeInTheDocument();
  });

  it('rejects additional files when multiple is false', async () => {
    const { container } = render(<Harness />);
    fireEvent.change(getFileInput(container), {
      target: { files: [makeFile('a.txt'), makeFile('b.txt')] },
    });

    expect(await screen.findByText('a.txt')).toBeInTheDocument();
    expect(
      await within(rejectedList()).findByText(/only one file can be added/i),
    ).toBeInTheDocument();
  });

  it('adds files dropped on the drop zone', async () => {
    render(<Harness />);
    fireEvent.dragOver(dropZone(), { dataTransfer: { files: [makeFile('dropped.txt')] } });
    fireEvent.drop(dropZone(), { dataTransfer: { files: [makeFile('dropped.txt')] } });

    expect(await screen.findByText('dropped.txt')).toBeInTheDocument();
  });

  it('renders an external validation error linked to the drop zone', () => {
    render(<Harness error="File is required" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('File is required');
    expect(dropZone()).toHaveAttribute('aria-describedby', alert.id);
  });

  it('does nothing when disabled', async () => {
    const { container } = render(<Harness disabled onUpload={() => Promise.resolve()} />);
    const zone = dropZone();
    expect(zone).toHaveAttribute('aria-disabled', 'true');

    await userEvent.upload(getFileInput(container), makeFile('x.txt'));
    expect(screen.queryByText('x.txt')).not.toBeInTheDocument();
  });

  it('calls onItemsChange with the current items', async () => {
    const onItemsChange = vi.fn();
    const { container } = render(<Harness onItemsChange={onItemsChange} />);

    await userEvent.upload(getFileInput(container), makeFile('a.txt'));
    await screen.findByText('a.txt');
    expect(onItemsChange).toHaveBeenLastCalledWith([expect.objectContaining({ status: 'done' })]);

    await userEvent.click(screen.getByRole('button', { name: 'Remove a.txt' }));
    expect(onItemsChange).toHaveBeenLastCalledWith([]);
  });

  it('announces status changes through the live region', async () => {
    const { container } = render(<Harness onUpload={() => Promise.resolve()} />);
    await userEvent.upload(getFileInput(container), makeFile('notes.txt'));
    await screen.findByText('Uploaded');
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(liveRegionText()).toContain('Uploaded notes.txt');
  });

  it('announces rejected files through the live region', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<Harness accept="image/png" />);
    await user.upload(getFileInput(container), makeFile('a.txt', 'text/plain'));
    await within(rejectedList()).findByText(/file type not allowed/i);
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    expect(liveRegionText()).toContain('Rejected a.txt');
  });
});
