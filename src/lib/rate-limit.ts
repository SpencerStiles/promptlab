/**
 * Simple in-memory rate limiter using a sliding window counter.
 *
 * Default: 20 requests per 60-second window per IP.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 20;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export function checkRateLimit(
  ip: string,
  limit: number = DEFAULT_LIMIT,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // New window
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, limit };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, limit };
}
