// A tiny Result type (as on Day 14): a function that can fail RETURNS its
// failure as data instead of throwing, so the caller has to handle both.

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

/** For exhaustive switches: a new union member that isn't handled is a compile error. */
export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new Error(`${message}: ${JSON.stringify(value)}`)
}
