/**
 * In-memory rate limiter.
 *
 * State diagram for a single IP entry:
 *
 *   [new IP]
 *      │
 *      ▼
 *   { count: 1, resetAt: now + windowMs }
 *      │
 *   subsequent calls within window
 *      ├── count < limit  → count++, allowed
 *      └── count >= limit → rejected
 *      │
 *   window expires (resetAt < now)
 *      └── entry replaced: count: 1, new resetAt
 *
 *   periodic sweep (every 5 min): deletes expired entries
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60_000; // 1 minute
const DEFAULT_LIMIT = 20; // calls per window

// Periodic sweep to prevent unbounded Map growth
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60_000).unref?.();
}

export function checkRateLimit(
  ip: string,
  limit = DEFAULT_LIMIT,
): { allowed: boolean; remaining: number; resetAt: number; limit: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS, limit };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, limit };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt, limit };
}
