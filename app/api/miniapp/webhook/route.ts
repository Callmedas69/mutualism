import { NextRequest, NextResponse } from "next/server";
import {
  upsertToken,
  disableToken,
  deleteToken,
} from "@/lib/repositories/notification-tokens";

/**
 * Farcaster MiniApp Webhook Handler
 *
 * Receives lifecycle events from Farcaster (Base64-encoded):
 * - frame_added: User installed the app
 * - frame_removed: User uninstalled the app
 * - notifications_enabled: User enabled push notifications
 * - notifications_disabled: User disabled push notifications
 *
 * Payload format:
 * {
 *   header: Base64<{ fid, type, key }>,
 *   payload: Base64<{ event, notificationDetails? }>,
 *   signature: string
 * }
 *
 * Per CLAUDE.md: API route validates input and delegates to repository.
 */

type WebhookEventType =
  | "frame_added"
  | "frame_removed"
  | "notifications_enabled"
  | "notifications_disabled";

interface DecodedHeader {
  fid: number;
  type: string;
  key: string;
}

interface DecodedPayload {
  event: WebhookEventType;
  notificationDetails?: {
    token: string;
    url: string;
  };
}

interface FarcasterWebhookBody {
  header: string;
  payload: string;
  signature: string;
}

function decodeBase64Json<T>(base64String: string): T | null {
  try {
    const decoded = Buffer.from(base64String, "base64").toString("utf-8");
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.error("[MiniApp Webhook] Failed to decode Base64 JSON:", error);
    return null;
  }
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

    const body: FarcasterWebhookBody = await request.json();

    // Debug: Log raw payload
    console.log("[MiniApp Webhook] Raw payload:", JSON.stringify(body));

    // Validate required fields
    if (!body.header || !body.payload) {
      console.error("[MiniApp Webhook] Missing header or payload");
      return NextResponse.json({ error: "Missing header or payload" }, { status: 400 });
    }

    // Decode Base64-encoded header and payload
    const header = decodeBase64Json<DecodedHeader>(body.header);
    const payload = decodeBase64Json<DecodedPayload>(body.payload);

    if (!header || typeof header.fid !== "number") {
      console.error("[MiniApp Webhook] Invalid header or missing fid");
      return NextResponse.json({ error: "Invalid header" }, { status: 400 });
    }

    if (!payload || !payload.event) {
      console.error("[MiniApp Webhook] Invalid payload or missing event");
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { fid } = header;
    const { event, notificationDetails } = payload;

    console.log(`[MiniApp Webhook] Event: ${event}, FID: ${fid}`);

    switch (event) {
      case "frame_added":
        console.log(`[MiniApp] User ${fid} added the app`);
        // If notifications are enabled on add, store the token
        if (notificationDetails?.token && notificationDetails?.url) {
          await upsertToken(fid, notificationDetails.token, notificationDetails.url);
          console.log(`[MiniApp] Stored notification token for FID ${fid}`);
        }
        break;

      case "frame_removed":
        console.log(`[MiniApp] User ${fid} removed the app`);
        // Hard delete - user uninstalled
        await deleteToken(fid);
        break;

      case "notifications_enabled":
        console.log(`[MiniApp] User ${fid} enabled notifications`);
        if (notificationDetails?.token && notificationDetails?.url) {
          await upsertToken(fid, notificationDetails.token, notificationDetails.url);
          console.log(`[MiniApp] Stored notification token for FID ${fid}`);
        } else {
          console.warn(`[MiniApp] Missing token or url for FID ${fid}`);
        }
        break;

      case "notifications_disabled":
        console.log(`[MiniApp] User ${fid} disabled notifications`);
        // Soft disable - user might re-enable
        await disableToken(fid);
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
