import { describe, expect, it } from 'vitest';

import { cn } from '@/utils/cn';

describe('cn', () => {
  it('joins truthy strings with a single space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out null, undefined, and false values', () => {
    expect(cn('a', null, 'b', undefined, false, 'c')).toBe('a b c');
  });

  it('returns an empty string when given only falsy values', () => {
    expect(cn(null, undefined, false)).toBe('');
  });

  it('returns an empty string when given nothing', () => {
    expect(cn()).toBe('');
  });
});
