import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from '@/components/ui/Spinner';

describe('Spinner', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('[role="presentation"]');
    expect(spinner).not.toBeNull();
    expect(spinner).toHaveAttribute('aria-hidden', 'true');
  });
});
