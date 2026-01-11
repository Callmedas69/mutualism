import { NextRequest, NextResponse } from "next/server";
import { getAllEnabledTokens } from "@/lib/repositories/notification-tokens";
import { sendNotificationToUsers } from "@/lib/services/notification-service";

/**
 * Admin Notification Endpoint
 *
 * Send notifications to all users with enabled notifications.
 * Protected by ADMIN_SECRET header.
 *
 * Usage:
 * curl -X POST https://mutualism.geoart.studio/api/admin/notify-all \
 *   -H "Content-Type: application/json" \
 *   -H "x-admin-secret: YOUR_ADMIN_SECRET" \
 *   -d '{"title":"New Feature!","body":"Check out the latest updates!","targetPath":"/graph"}'
 */

export async function POST(request: NextRequest) {
  try {
    // Verify admin secret
    const secret = request.headers.get("x-admin-secret");
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      console.warn("[Admin Notify] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, targetPath = "/graph" } = await request.json();

    // Validate required fields
    if (!title || !body) {
      return NextResponse.json({ error: "Missing title or body" }, { status: 400 });
    }

    // Get all users with enabled notifications
    const tokens = await getAllEnabledTokens();
    const fids = tokens.map(t => t.fid);

    if (fids.length === 0) {
      return NextResponse.json({
        totalUsers: 0,
        sent: 0,
        failed: 0,
        rateLimited: 0,
        message: "No users with enabled notifications",
      });
    }

    console.log(`[Admin Notify] Sending to ${fids.length} users`);

    // Send notifications (rate limiting built-in)
    const result = await sendNotificationToUsers(fids, "graph_changes", title, body, targetPath);

    console.log(`[Admin Notify] Result: sent=${result.sent}, failed=${result.failed}, rateLimited=${result.rateLimited}`);

    return NextResponse.json({
      totalUsers: fids.length,
      ...result,
    });
  } catch (error) {
    console.error("[Admin Notify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
