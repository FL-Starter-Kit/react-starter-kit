import { describe, expect, it } from 'vitest';

import { invariant, InvariantError } from '@/utils/invariant';

describe('invariant', () => {
  it('does not throw when the condition holds', () => {
    expect(() => { invariant(true, 'should not throw'); }).not.toThrow();
    expect(() => { invariant('truthy', 'should not throw'); }).not.toThrow();
  });

  it('throws InvariantError when the condition is falsy', () => {
    expect(() => { invariant(false, 'boom'); }).toThrow(InvariantError);
    expect(() => { invariant(false, 'boom'); }).toThrow('boom');
    expect(() => { invariant(null, 'boom'); }).toThrow(InvariantError);
    expect(() => { invariant(0, 'boom'); }).toThrow(InvariantError);
  });

  it('narrows the type when the condition holds', () => {
    const value: string | null = 'hello';
    invariant(value, 'must be present');
    expect(value.toUpperCase()).toBe('HELLO');
  });
});
