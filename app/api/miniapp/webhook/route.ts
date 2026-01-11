import { NextRequest, NextResponse } from "next/server";
import {
  upsertToken,
  disableToken,
  deleteToken,
} from "@/lib/repositories/notification-tokens";

/**
 * Farcaster MiniApp Webhook Handler
 *
 * Receives lifecycle events from Farcaster:
 * - miniapp_added: User installed the app
 * - miniapp_removed: User uninstalled the app
 * - notifications_enabled: User enabled push notifications
 * - notifications_disabled: User disabled push notifications
 *
 * Per CLAUDE.md: API route validates input and delegates to repository.
 */

type WebhookEventType =
  | "miniapp_added"
  | "miniapp_removed"
  | "notifications_enabled"
  | "notifications_disabled";

interface WebhookEvent {
  event: WebhookEventType;
  data: {
    fid: number;
    // Present on notifications_enabled and miniapp_added (if notifications enabled)
    notificationToken?: string;
    url?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const webhookSecret = process.env.MINIAPP_WEBHOOK_SECRET;
    if (webhookSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${webhookSecret}`) {
        console.warn("[MiniApp Webhook] Unauthorized request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();

    // Debug: Log raw payload to understand Farcaster's actual format
    console.log("[MiniApp Webhook] Raw payload:", JSON.stringify(body));

    const { event, data } = body as WebhookEvent;

    // Validate required fields
    if (!event) {
      console.error("[MiniApp Webhook] Missing event field");
      return NextResponse.json({ error: "Missing event field" }, { status: 400 });
    }

    if (!data || typeof data.fid !== "number") {
      console.error("[MiniApp Webhook] Missing or invalid data.fid");
      return NextResponse.json({ error: "Missing or invalid data.fid" }, { status: 400 });
    }

    console.log(`[MiniApp Webhook] Event: ${event}, FID: ${data.fid}`);

    switch (event) {
      case "miniapp_added":
        console.log(`[MiniApp] User ${data.fid} added the app`);
        // If notifications are enabled on add, store the token
        if (data.notificationToken && data.url) {
          await upsertToken(data.fid, data.notificationToken, data.url);
          console.log(`[MiniApp] Stored notification token for FID ${data.fid}`);
        }
        break;

      case "miniapp_removed":
        console.log(`[MiniApp] User ${data.fid} removed the app`);
        // Hard delete - user uninstalled
        await deleteToken(data.fid);
        break;

      case "notifications_enabled":
        console.log(`[MiniApp] User ${data.fid} enabled notifications`);
        if (data.notificationToken && data.url) {
          await upsertToken(data.fid, data.notificationToken, data.url);
          console.log(`[MiniApp] Stored notification token for FID ${data.fid}`);
        } else {
          console.warn(`[MiniApp] Missing token or url for FID ${data.fid}`);
        }
        break;

      case "notifications_disabled":
        console.log(`[MiniApp] User ${data.fid} disabled notifications`);
        // Soft disable - user might re-enable
        await disableToken(data.fid);
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
