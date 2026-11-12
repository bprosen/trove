/** Minimal runtime guard: payloads must be plain objects. Field-level validation happens in the handlers. */
export function objectInput<T>(d: T): T {
  if (typeof d !== "object" || d === null || Array.isArray(d)) throw new Error("Invalid input");
  return d;
}
