import { NextRequest, NextResponse } from "next/server";
import { getUsersNeedingReminder, updateLastNotified, getActiveUsers } from "@/lib/repositories/user-graph-state";
import { getToken } from "@/lib/repositories/notification-tokens";
import { sendReminder, sendNotificationToUser } from "@/lib/services/notification-service";

/**
 * Cron Job: Notification Scheduler
 *
 * Runs daily at 9:00 AM UTC (configured in vercel.json)
 *
 * Daily tasks:
 * - Send reminders to users who haven't checked their graph in 7, 14, or 30 days
 *
 * Weekly tasks (Sundays):
 * - Send weekly engagement notification to active users
 *
 * Per CLAUDE.md: API route validates input, delegates to service.
 */

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[Cron] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Starting notification job");

  const results = {
    reminders: { checked: 0, sent: 0, skipped: 0, failed: 0 },
    weekly: { checked: 0, sent: 0, skipped: 0, failed: 0 },
  };

  try {
    // Daily: Process reminders for each interval
    await processReminders(7, results.reminders);
    await processReminders(14, results.reminders);
    await processReminders(30, results.reminders);

    // Weekly: Send engagement notification on Sundays
    const today = new Date();
    if (today.getUTCDay() === 0) {
      console.log("[Cron] Sunday - processing weekly engagement");
      await processWeeklyEngagement(results.weekly);
    }

    console.log("[Cron] Job completed:", results);

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        results,
      },
      { status: 500 }
    );
  }
}

async function processReminders(
  days: 7 | 14 | 30,
  results: { checked: number; sent: number; skipped: number; failed: number }
): Promise<void> {
  console.log(`[Cron] Processing ${days}-day reminders`);

  // Get users who haven't checked in X days
  const users = await getUsersNeedingReminder(days, 50);
  console.log(`[Cron] Found ${users.length} users for ${days}-day reminder`);

  for (const user of users) {
    results.checked++;

    // Check if user has notifications enabled
    const token = await getToken(user.fid);
    if (!token) {
      results.skipped++;
      continue;
    }

    // Send reminder
    const result = await sendReminder(user.fid, days);

    if (result.success) {
      results.sent++;
      // Update last notified timestamp
      await updateLastNotified(user.fid);
    } else if (result.rateLimited) {
      results.skipped++;
    } else {
      results.failed++;
      console.error(`[Cron] Failed to send to FID ${user.fid}:`, result.error);
    }

    // Small delay between notifications
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

/**
 * Weekly engagement notification for active users
 * Sent to users who visited in last 30 days but not in last 2 days
 */
async function processWeeklyEngagement(
  results: { checked: number; sent: number; skipped: number; failed: number }
): Promise<void> {
  console.log("[Cron] Processing weekly engagement notifications");

  // Get users active in last 30 days but not last 2 days
  const activeUsers = await getActiveUsers(30, 2, 50);
  console.log(`[Cron] Found ${activeUsers.length} active users for weekly engagement`);

  for (const user of activeUsers) {
    results.checked++;

    // Check if user has notifications enabled
    const token = await getToken(user.fid);
    if (!token) {
      results.skipped++;
      continue;
    }

    // Send weekly engagement notification
    const result = await sendNotificationToUser(
      user.fid,
      "graph_changes",
      "Weekly Graph Update",
      "Your connections may have changed. Tap to see what's new!",
      "/graph"
    );

    if (result.success) {
      results.sent++;
      await updateLastNotified(user.fid);
    } else if (result.rateLimited) {
      results.skipped++;
    } else {
      results.failed++;
      console.error(`[Cron] Failed to send weekly to FID ${user.fid}:`, result.error);
    }

    // Small delay between notifications
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
