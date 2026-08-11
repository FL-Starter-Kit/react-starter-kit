/**
 * Branded types make accidental misuse of primitive values a compile error.
 * Example: a `UserId` cannot be passed where a plain `string` is expected.
 */

declare const brand: unique symbol;

export type Branded<T, Brand extends string> = T & { readonly [brand]: Brand };

export type UserId = Branded<string, 'UserId'>;
export type Email = Branded<string, 'Email'>;
