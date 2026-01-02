/**
 * Farcaster MiniApp Push Notifications
 *
 * Rate limits:
 * - 1 notification per 30 seconds per token
 * - 100 notifications per day per token
 *
 * @see https://miniapps.farcaster.xyz/docs/guides/notifications
 */

interface NotificationPayload {
  notificationToken: string;
  title: string;
  body: string;
  targetUrl?: string;
}

interface NotificationResponse {
  success: boolean;
  error?: string;
}

const FARCASTER_NOTIFICATION_URL = "https://api.warpcast.com/v1/frame-notifications";

/**
 * Send a push notification to a Farcaster user
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResponse> {
  try {
    const response = await fetch(FARCASTER_NOTIFICATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationToken: payload.notificationToken,
        title: payload.title,
        body: payload.body,
        targetUrl: payload.targetUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Notification] Failed to send:", errorText);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    console.log("[Notification] Sent successfully");
    return { success: true };
  } catch (error) {
    console.error("[Notification] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification to multiple users (batch)
 * Respects rate limits by spacing requests
 */
export async function sendBatchNotifications(
  tokens: string[],
  title: string,
  body: string,
  targetUrl?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    const result = await sendNotification({
      notificationToken: token,
      title,
      body,
      targetUrl,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Respect rate limit: wait 100ms between requests
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return { sent, failed };
}
