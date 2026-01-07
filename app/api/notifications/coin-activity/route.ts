import { NextRequest, NextResponse } from "next/server";
import { notifyCoinActivity } from "@/lib/services/notification-service";

/**
 * Coin Activity Notification Endpoint
 *
 * Called by external webhooks (e.g., Zora) when coin buy/sell events occur.
 * Sends push notification to the coin owner.
 *
 * Per CLAUDE.md: API route validates input, delegates to service.
 */

interface CoinActivityPayload {
  /** FID of the coin owner to notify */
  ownerFid: number;
  /** Type of activity */
  action: "buy" | "sell";
  /** Amount in human-readable format (e.g., "0.5 ETH") */
  amount: string;
  /** Username of the buyer (optional) */
  buyerUsername?: string;
  /** Secret for authentication */
  secret?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CoinActivityPayload = await request.json();
    const { ownerFid, action, amount, buyerUsername, secret } = body;

    // Validate webhook secret
    const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET;
    if (webhookSecret && secret !== webhookSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!ownerFid || typeof ownerFid !== "number") {
      return NextResponse.json(
        { error: "Invalid ownerFid" },
        { status: 400 }
      );
    }

    if (!action || !["buy", "sell"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action - must be 'buy' or 'sell'" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "string") {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Send notification via service layer
    const result = await notifyCoinActivity(
      ownerFid,
      action,
      amount,
      buyerUsername
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    }

    // Handle rate limiting gracefully
    if (result.rateLimited) {
      return NextResponse.json(
        { success: false, rateLimited: true, error: result.error },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Coin Activity] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
