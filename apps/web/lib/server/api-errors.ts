const isProd = process.env.NODE_ENV === "production";

/** Avoid leaking internals, stack traces, or ciphertext in production API responses. */
export function clientSafeError(
  error: unknown,
  fallback: string,
  devFallback?: string,
): string {
  if (isProd) {
    return fallback;
  }
  if (error instanceof Error) {
    return devFallback ?? error.message;
  }
  return fallback;
}
