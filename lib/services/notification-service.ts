import { getToken, getTokensByFids } from "@/lib/repositories/notification-tokens";
import {
  insertHistory,
  countTodayByFid,
  getSecondsSinceLastNotification,
  getLastNotificationByType,
} from "@/lib/repositories/notification-history";
import {
  getState,
  updateMutualCount,
} from "@/lib/repositories/user-graph-state";

/**
 * Notification Service
 *
 * Business logic layer for sending push notifications.
 * Handles rate limiting, history logging, and notification triggers.
 *
 * Per CLAUDE.md: Service layer contains all business rules.
 *
 * Rate limits (enforced by Warpcast):
 * - 1 notification per 30 seconds per token
 * - 100 notifications per day per token
 */

// ============================================
// Types
// ============================================

export type NotificationType =
  | "new_mutual"
  | "graph_changes"
  | "coin_activity"
  | "reminder_7d"
  | "reminder_14d"
  | "reminder_30d";

interface SendResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

interface WarpcastNotificationPayload {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

interface WarpcastNotificationResponse {
  successfulTokens: string[];
  invalidTokens: string[];
  rateLimitedTokens: string[];
}

// ============================================
// Constants
// ============================================

const RATE_LIMIT_SECONDS = 30;
const RATE_LIMIT_DAILY = 100;
const APP_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://mutualism.geoart.studio";

// ============================================
// Core Send Function
// ============================================

/**
 * Send a notification to a single user by FID
 * Handles rate limiting and history logging
 */
export async function sendNotificationToUser(
  fid: number,
  type: NotificationType,
  title: string,
  body: string,
  targetPath: string = "/graph"
): Promise<SendResult> {
  // Get user's notification token
  const tokenData = await getToken(fid);
  if (!tokenData) {
    return { success: false, error: "User has no notification token" };
  }

  // Check rate limits
  const rateLimitCheck = await checkRateLimits(fid);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: rateLimitCheck.reason,
      rateLimited: true,
    };
  }

  // Generate unique notification ID for idempotency
  const notificationId = `${fid}-${type}-${Date.now()}`;
  const targetUrl = `${APP_DOMAIN}${targetPath}`;

  // Send notification via Warpcast API
  const result = await sendToWarpcast(tokenData.url, {
    notificationId,
    title: truncate(title, 32),
    body: truncate(body, 128),
    targetUrl,
    tokens: [tokenData.token],
  });

  // Log to history
  await insertHistory({
    fid,
    notification_type: type,
    title: truncate(title, 32),
    body: truncate(body, 128),
    success: result.success,
  });

  return result;
}

/**
 * Send notification to multiple users
 * Returns summary of results
 */
export async function sendNotificationToUsers(
  fids: number[],
  type: NotificationType,
  title: string,
  body: string,
  targetPath: string = "/graph"
): Promise<{ sent: number; failed: number; rateLimited: number }> {
  let sent = 0;
  let failed = 0;
  let rateLimited = 0;

  for (const fid of fids) {
    const result = await sendNotificationToUser(fid, type, title, body, targetPath);

    if (result.success) {
      sent++;
    } else if (result.rateLimited) {
      rateLimited++;
    } else {
      failed++;
    }

    // Small delay to avoid overwhelming the API
    await sleep(100);
  }

  return { sent, failed, rateLimited };
}

// ============================================
// Notification Triggers
// ============================================

/**
 * Notify user about a new mutual connection
 */
export async function notifyNewMutual(
  fid: number,
  newMutualUsername: string
): Promise<SendResult> {
  return sendNotificationToUser(
    fid,
    "new_mutual",
    "New Mutual Connection",
    `@${newMutualUsername} is now following you back!`,
    "/graph"
  );
}

/**
 * Notify user about graph changes
 */
export async function notifyGraphChanges(
  fid: number,
  newMutuals: number,
  lostMutuals: number
): Promise<SendResult> {
  const parts: string[] = [];
  if (newMutuals > 0) parts.push(`+${newMutuals} new`);
  if (lostMutuals > 0) parts.push(`-${lostMutuals} lost`);

  const body = parts.length > 0
    ? `Your connections changed: ${parts.join(", ")}`
    : "Your graph has been updated";

  return sendNotificationToUser(
    fid,
    "graph_changes",
    "Graph Update",
    body,
    "/graph"
  );
}

/**
 * Notify user about coin activity
 */
export async function notifyCoinActivity(
  fid: number,
  action: "buy" | "sell",
  amount: string,
  buyerUsername?: string
): Promise<SendResult> {
  const body = action === "buy"
    ? `${buyerUsername ? `@${buyerUsername}` : "Someone"} bought ${amount} of your coin!`
    : `Your coin was sold for ${amount}`;

  return sendNotificationToUser(
    fid,
    "coin_activity",
    "Coin Activity",
    body,
    "/gallery"
  );
}

/**
 * Send reminder notification
 */
export async function sendReminder(
  fid: number,
  days: 7 | 14 | 30
): Promise<SendResult> {
  const type: NotificationType = `reminder_${days}d` as NotificationType;

  // Check if we already sent this reminder type recently
  const lastReminder = await getLastNotificationByType(fid, type);
  if (lastReminder) {
    const lastSentAt = new Date(lastReminder.sent_at);
    const daysSinceLast = Math.floor(
      (Date.now() - lastSentAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    // Don't send the same reminder type within 7 days
    if (daysSinceLast < 7) {
      return { success: false, error: "Reminder already sent recently", rateLimited: true };
    }
  }

  return sendNotificationToUser(
    fid,
    type,
    "Check Your Graph",
    `It's been ${days} days since you last visited. See what's changed!`,
    "/graph"
  );
}

// ============================================
// Change Detection
// ============================================

interface MutualChangeResult {
  hasChanges: boolean;
  newMutuals: number;
  lostMutuals: number;
  notificationSent: boolean;
  error?: string;
}

/**
 * Check for mutual changes and send notification if significant
 * Called when user loads their graph with fresh data
 */
export async function checkAndNotifyMutualChanges(
  fid: number,
  currentMutualCount: number
): Promise<MutualChangeResult> {
  // Get stored state
  const state = await getState(fid);

  if (!state) {
    // First time - just record, don't notify
    return {
      hasChanges: false,
      newMutuals: 0,
      lostMutuals: 0,
      notificationSent: false,
    };
  }

  const previousCount = state.mutual_count;
  const diff = currentMutualCount - previousCount;

  // No change
  if (diff === 0) {
    return {
      hasChanges: false,
      newMutuals: 0,
      lostMutuals: 0,
      notificationSent: false,
    };
  }

  const newMutuals = diff > 0 ? diff : 0;
  const lostMutuals = diff < 0 ? Math.abs(diff) : 0;

  // Update stored count
  await updateMutualCount(fid, currentMutualCount);

  // Check if we already sent a new_mutual notification recently (within 1 hour)
  const lastNotification = await getLastNotificationByType(fid, "new_mutual");
  if (lastNotification) {
    const hoursSinceLast = (Date.now() - new Date(lastNotification.sent_at).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLast < 1) {
      return {
        hasChanges: true,
        newMutuals,
        lostMutuals,
        notificationSent: false,
        error: "Notification already sent recently",
      };
    }
  }

  // Only notify for new mutuals (positive change)
  if (newMutuals > 0) {
    const body = newMutuals === 1
      ? "You have a new mutual connection!"
      : `You have ${newMutuals} new mutual connections!`;

    const result = await sendNotificationToUser(
      fid,
      "new_mutual",
      "New Mutuals",
      body,
      "/graph"
    );

    return {
      hasChanges: true,
      newMutuals,
      lostMutuals,
      notificationSent: result.success,
      error: result.error,
    };
  }

  return {
    hasChanges: true,
    newMutuals,
    lostMutuals,
    notificationSent: false,
  };
}

// ============================================
// Rate Limiting
// ============================================

interface RateLimitCheck {
  allowed: boolean;
  reason?: string;
}

async function checkRateLimits(fid: number): Promise<RateLimitCheck> {
  // Check 30-second cooldown
  const secondsSinceLast = await getSecondsSinceLastNotification(fid);
  if (secondsSinceLast !== null && secondsSinceLast < RATE_LIMIT_SECONDS) {
    return {
      allowed: false,
      reason: `Rate limited: ${RATE_LIMIT_SECONDS - secondsSinceLast}s cooldown remaining`,
    };
  }

  // Check daily limit
  const todayCount = await countTodayByFid(fid);
  if (todayCount >= RATE_LIMIT_DAILY) {
    return {
      allowed: false,
      reason: `Daily limit reached: ${todayCount}/${RATE_LIMIT_DAILY}`,
    };
  }

  return { allowed: true };
}

// ============================================
// Warpcast API
// ============================================

async function sendToWarpcast(
  url: string,
  payload: WarpcastNotificationPayload
): Promise<SendResult> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Notification] Warpcast API error:", errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();

    // Debug: Log response to understand format
    console.log("[Notification] Warpcast response:", JSON.stringify(data));

    // Handle response with defensive checks (per Farcaster spec)
    const result = data.result || data;
    const successfulTokens = result.successfulTokens || [];
    const invalidTokens = result.invalidTokens || [];
    const rateLimitedTokens = result.rateLimitedTokens || [];

    // Check if our token was successful
    if (successfulTokens.length > 0) {
      console.log("[Notification] Sent successfully");
      return { success: true };
    }

    if (invalidTokens.length > 0) {
      return { success: false, error: "Token is invalid" };
    }

    if (rateLimitedTokens.length > 0) {
      return { success: false, error: "Rate limited by Warpcast", rateLimited: true };
    }

    // If 200 OK with no recognized fields, assume success
    if (!data.error) {
      console.log("[Notification] Assumed success (no error in response)");
      return { success: true };
    }

    return { success: false, error: data.error || "Unknown response from Warpcast" };
  } catch (error) {
    console.error("[Notification] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// Utilities
// ============================================

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
