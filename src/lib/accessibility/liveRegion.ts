/**
 * Screen-reader announcement helpers.
 *
 * `announce()` writes a message into a live region so assistive
 * technology announces it without moving focus. Use sparingly for
 * meaningful state changes (e.g. "User deleted") — NOT for trivial
 * loading operations.
 */

let politeRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;

function getRegion(politeness: 'polite' | 'assertive'): HTMLElement {
  const existing = politeness === 'polite' ? politeRegion : assertiveRegion;
  if (existing?.isConnected) {
    return existing;
  }

  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', politeness);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only-live-region';
  // Visually hidden but available to assistive technology.
  region.style.position = 'fixed';
  region.style.width = '1px';
  region.style.height = '1px';
  region.style.margin = '-1px';
  region.style.padding = '0';
  region.style.border = '0';
  region.style.clip = 'rect(0 0 0 0)';
  region.style.clipPath = 'inset(50%)';
  region.style.overflow = 'hidden';
  region.style.whiteSpace = 'nowrap';
  document.body.appendChild(region);

  if (politeness === 'polite') {
    politeRegion = region;
  } else {
    assertiveRegion = region;
  }
  return region;
}

/** Announce a message to screen readers. */
export function announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
  const region = getRegion(politeness);
  // Reset + defer so repeated identical messages are still announced.
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 20);
}
