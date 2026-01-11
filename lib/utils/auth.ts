import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/**
 * Authentication Utilities
 *
 * Provides timing-safe secret comparison to prevent timing attacks.
 * Per CLAUDE.md: Never compromise on security.
 */

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses crypto.timingSafeEqual for secure comparison.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Verify admin secret with fail-fast behavior.
 * Returns error response if invalid, null if valid.
 *
 * Security rules:
 * - Fails if ADMIN_SECRET env var not configured (500)
 * - Fails if header missing or doesn't match (401)
 * - Uses timing-safe comparison to prevent timing attacks
 */
export function verifyAdminSecret(headerSecret: string | null): NextResponse | null {
  const adminSecret = process.env.ADMIN_SECRET;

  // Fail fast if not configured
  if (!adminSecret) {
    console.error("[Auth] ADMIN_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Validate header exists and matches
  if (!headerSecret || !safeCompare(headerSecret, adminSecret)) {
    console.warn("[Auth] Unauthorized admin request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Valid - no error
}

/**
 * Verify cron secret (optional but recommended).
 * Returns error response if invalid, null if valid.
 *
 * Security rules:
 * - If CRON_SECRET not configured, allows request (Vercel handles cron auth)
 * - If configured, requires matching Bearer token
 * - Uses timing-safe comparison to prevent timing attacks
 */
export function verifyCronSecret(authHeader: string | null): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;

  // Allow if not configured (Vercel handles cron auth via headers)
  if (!cronSecret) {
    return null;
  }

  const expected = `Bearer ${cronSecret}`;

  // Validate header exists and matches
  if (!authHeader || !safeCompare(authHeader, expected)) {
    console.warn("[Auth] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Valid - no error
}
