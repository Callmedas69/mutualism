import { supabase } from "@/lib/supabase/client";
import type {
  NotificationHistoryRow,
  NotificationHistoryInsert,
} from "@/lib/supabase/types";

/**
 * Notification History Repository
 *
 * Audit trail for sent notifications.
 * Used for rate limiting and debugging.
 *
 * Per CLAUDE.md: Repository is data-access only, no business logic.
 */

// ============================================
// Insert Operations
// ============================================

/**
 * Insert a notification history record
 */
export async function insertHistory(
  data: NotificationHistoryInsert
): Promise<NotificationHistoryRow | null> {
  const { data: row, error } = await supabase
    .from("notification_history")
    .insert({
      fid: data.fid,
      notification_type: data.notification_type,
      title: data.title,
      body: data.body,
      success: data.success ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert notification history:", error);
    return null;
  }

  return row;
}

// ============================================
// Query Operations
// ============================================

/**
 * Get recent notifications for a user
 */
export async function getRecentByFid(
  fid: number,
  limit: number = 20
): Promise<NotificationHistoryRow[]> {
  const { data, error } = await supabase
    .from("notification_history")
    .select("*")
    .eq("fid", fid)
    .order("sent_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get notification history:", error);
    return [];
  }

  return data || [];
}

/**
 * Get the last notification of a specific type for a user
 */
export async function getLastNotificationByType(
  fid: number,
  notificationType: string
): Promise<NotificationHistoryRow | null> {
  const { data, error } = await supabase
    .from("notification_history")
    .select("*")
    .eq("fid", fid)
    .eq("notification_type", notificationType)
    .eq("success", true)
    .order("sent_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Failed to get last notification:", error);
    }
    return null;
  }

  return data;
}

/**
 * Count notifications sent to a user today
 * Used for daily rate limit check (100/day per token)
 */
export async function countTodayByFid(fid: number): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("notification_history")
    .select("*", { count: "exact", head: true })
    .eq("fid", fid)
    .eq("success", true)
    .gte("sent_at", today.toISOString());

  if (error) {
    console.error("Failed to count today's notifications:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get time since last notification to a user
 * Used for per-token rate limit check (30s between notifications)
 */
export async function getSecondsSinceLastNotification(
  fid: number
): Promise<number | null> {
  const { data, error } = await supabase
    .from("notification_history")
    .select("sent_at")
    .eq("fid", fid)
    .eq("success", true)
    .order("sent_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Failed to get last notification time:", error);
    }
    return null; // No previous notification
  }

  const lastSentAt = new Date(data.sent_at);
  const now = new Date();
  return Math.floor((now.getTime() - lastSentAt.getTime()) / 1000);
}

/**
 * Count total notifications sent
 */
export async function countTotal(): Promise<number> {
  const { count, error } = await supabase
    .from("notification_history")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Failed to count total notifications:", error);
    return 0;
  }

  return count || 0;
}
