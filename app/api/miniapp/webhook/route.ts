import { NextRequest, NextResponse } from "next/server";

// Webhook event types from Farcaster
type WebhookEventType =
  | "miniapp_added"
  | "miniapp_removed"
  | "notifications_enabled"
  | "notifications_disabled";

interface WebhookEvent {
  event: WebhookEventType;
  data: {
    fid: number;
    notificationToken?: string;
  };
}

// In production, store tokens in a database
// For now, we'll just log them
const notificationTokens = new Map<number, string>();

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.MINIAPP_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body: WebhookEvent = await request.json();
    const { event, data } = body;

    console.log(`[MiniApp Webhook] Event: ${event}, FID: ${data.fid}`);

    switch (event) {
      case "miniapp_added":
        console.log(`[MiniApp] User ${data.fid} added the app`);
        break;

      case "miniapp_removed":
        console.log(`[MiniApp] User ${data.fid} removed the app`);
        // Remove notification token
        notificationTokens.delete(data.fid);
        break;

      case "notifications_enabled":
        console.log(`[MiniApp] User ${data.fid} enabled notifications`);
        if (data.notificationToken) {
          // Store the notification token
          notificationTokens.set(data.fid, data.notificationToken);
          console.log(`[MiniApp] Stored notification token for FID ${data.fid}`);
        }
        break;

      case "notifications_disabled":
        console.log(`[MiniApp] User ${data.fid} disabled notifications`);
        // Remove notification token
        notificationTokens.delete(data.fid);
        break;

      default:
        console.log(`[MiniApp] Unknown event type: ${event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MiniApp Webhook] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export for use by notification sender
export function getNotificationToken(fid: number): string | undefined {
  return notificationTokens.get(fid);
}

export function getAllNotificationTokens(): Map<number, string> {
  return new Map(notificationTokens);
}
