/**
 * Simple in-memory rate limiter for snapshot uploads
 *
 * Limits: 5 snapshots per hour per FID
 *
 * Note: For production at scale, use Redis or similar
 * In-memory works for single instance deployment
 */

const rateLimiter = new Map<number, { count: number; resetAt: number }>();

const LIMIT = 5;
const WINDOW_MS = 3600000; // 1 hour

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a FID is within rate limits
 * @param fid - Farcaster ID to check
 * @returns Rate limit status
 */
export function checkRateLimit(fid: number): RateLimitResult {
  const now = Date.now();
  const record = rateLimiter.get(fid);

  // First request or window expired - reset
  if (!record || now > record.resetAt) {
    rateLimiter.set(fid, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: LIMIT - 1, resetAt: now + WINDOW_MS };
  }

  // Limit exceeded
  if (record.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  // Increment and allow
  record.count++;
  return { allowed: true, remaining: LIMIT - record.count, resetAt: record.resetAt };
}

/**
 * Get current rate limit status without incrementing
 * @param fid - Farcaster ID to check
 */
export function getRateLimitStatus(fid: number): RateLimitResult {
  const now = Date.now();
  const record = rateLimiter.get(fid);

  if (!record || now > record.resetAt) {
    return { allowed: true, remaining: LIMIT, resetAt: now + WINDOW_MS };
  }

  return {
    allowed: record.count < LIMIT,
    remaining: Math.max(0, LIMIT - record.count),
    resetAt: record.resetAt,
  };
}
