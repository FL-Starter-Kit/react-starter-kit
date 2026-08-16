import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('is decorative and takes width/height styles', () => {
    const { container } = render(<Skeleton width="2rem" height="3rem" />);
    const skeleton = container.querySelector('span');
    expect(skeleton).not.toBeNull();
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton?.getAttribute('style')).toContain('width: 2rem');
    expect(skeleton?.getAttribute('style')).toContain('height: 3rem');
  });
});
