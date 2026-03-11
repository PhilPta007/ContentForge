/**
 * In-memory sliding window rate limiter.
 * Tracks request timestamps per key (typically IP address) and enforces
 * a maximum number of requests within a rolling time window.
 *
 * Note: On Vercel serverless, each cold start gets a fresh Map.
 * This provides per-instance protection rather than global rate limiting.
 * For strict global limits, use an external store (Redis/Upstash).
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

/** Periodically clean up expired entries to prevent memory leaks */
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupStore(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

/**
 * Check and record a rate limit hit for the given key.
 *
 * @param key - Unique identifier (typically IP address)
 * @param limit - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanupStore(windowMs);

  const entry = store.get(key);

  if (!entry) {
    store.set(key, { timestamps: [now] });
    return { success: true, remaining: limit - 1 };
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.timestamps.push(now);
  return { success: true, remaining: limit - entry.timestamps.length };
}

/**
 * Extract client IP address from request headers.
 * Checks x-forwarded-for (first IP in chain), then x-real-ip, then falls back to 'anonymous'.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return 'anonymous';
}
