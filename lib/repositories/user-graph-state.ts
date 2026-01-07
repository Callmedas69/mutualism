import { supabase } from "@/lib/supabase/client";
import type {
  UserGraphStateRow,
  UserGraphStateInsert,
  UserGraphStateUpdate,
} from "@/lib/supabase/types";

/**
 * User Graph State Repository
 *
 * Tracks user's graph state for:
 * - Change detection (mutual count changes)
 * - Reminder scheduling (last visit tracking)
 *
 * Per CLAUDE.md: Repository is data-access only, no business logic.
 */

// ============================================
// Insert/Update Operations
// ============================================

/**
 * Upsert user graph state
 * Called when user views their graph
 */
export async function upsertState(
  fid: number,
  mutualCount?: number
): Promise<UserGraphStateRow | null> {
  const updateData: UserGraphStateUpdate = {
    last_checked_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (mutualCount !== undefined) {
    updateData.mutual_count = mutualCount;
  }

  const { data, error } = await supabase
    .from("user_graph_state")
    .upsert(
      {
        fid,
        mutual_count: mutualCount ?? 0,
        last_checked_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fid" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to upsert user graph state:", error);
    return null;
  }

  return data;
}

/**
 * Update last notified timestamp
 * Called after sending a reminder notification
 */
export async function updateLastNotified(fid: number): Promise<boolean> {
  const { error } = await supabase
    .from("user_graph_state")
    .update({
      last_notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("fid", fid);

  if (error) {
    console.error("Failed to update last notified:", error);
    return false;
  }

  return true;
}

/**
 * Update mutual count only
 * Used for change detection
 */
export async function updateMutualCount(
  fid: number,
  mutualCount: number
): Promise<boolean> {
  const { error } = await supabase
    .from("user_graph_state")
    .update({
      mutual_count: mutualCount,
      updated_at: new Date().toISOString(),
    })
    .eq("fid", fid);

  if (error) {
    console.error("Failed to update mutual count:", error);
    return false;
  }

  return true;
}

// ============================================
// Query Operations
// ============================================

/**
 * Get user graph state
 */
export async function getState(fid: number): Promise<UserGraphStateRow | null> {
  const { data, error } = await supabase
    .from("user_graph_state")
    .select("*")
    .eq("fid", fid)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Failed to get user graph state:", error);
    }
    return null;
  }

  return data;
}

/**
 * Get users who need reminder notifications
 * Returns users who haven't checked their graph in X days
 * and haven't been notified recently
 */
export async function getUsersNeedingReminder(
  daysSinceLastCheck: number,
  limit: number = 100
): Promise<UserGraphStateRow[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastCheck);

  // Get users who:
  // 1. Haven't checked in X days
  // 2. Haven't been notified in the last 7 days (or never notified)
  const notificationCutoff = new Date();
  notificationCutoff.setDate(notificationCutoff.getDate() - 7);

  const { data, error } = await supabase
    .from("user_graph_state")
    .select("*")
    .lt("last_checked_at", cutoffDate.toISOString())
    .or(`last_notified_at.is.null,last_notified_at.lt.${notificationCutoff.toISOString()}`)
    .order("last_checked_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to get users needing reminder:", error);
    return [];
  }

  return data || [];
}

/**
 * Get users who checked their graph within a date range
 * Useful for analytics
 */
export async function getUsersCheckedBetween(
  startDate: Date,
  endDate: Date
): Promise<UserGraphStateRow[]> {
  const { data, error } = await supabase
    .from("user_graph_state")
    .select("*")
    .gte("last_checked_at", startDate.toISOString())
    .lte("last_checked_at", endDate.toISOString());

  if (error) {
    console.error("Failed to get users checked between dates:", error);
    return [];
  }

  return data || [];
}

/**
 * Count total tracked users
 */
export async function countTrackedUsers(): Promise<number> {
  const { count, error } = await supabase
    .from("user_graph_state")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Failed to count tracked users:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get active users for weekly engagement
 * Returns users who checked within maxDays but not within minDays
 * and haven't been notified in the last 7 days
 */
export async function getActiveUsers(
  maxDaysInactive: number,
  minDaysInactive: number,
  limit: number = 100
): Promise<UserGraphStateRow[]> {
  const maxCutoff = new Date();
  maxCutoff.setDate(maxCutoff.getDate() - maxDaysInactive);

  const minCutoff = new Date();
  minCutoff.setDate(minCutoff.getDate() - minDaysInactive);

  const notificationCutoff = new Date();
  notificationCutoff.setDate(notificationCutoff.getDate() - 7);

  // Get users who:
  // 1. Checked within last maxDaysInactive days (active users)
  // 2. Haven't checked in last minDaysInactive days (not too recent)
  // 3. Haven't been notified in the last 7 days
  const { data, error } = await supabase
    .from("user_graph_state")
    .select("*")
    .gt("last_checked_at", maxCutoff.toISOString())
    .lt("last_checked_at", minCutoff.toISOString())
    .or(`last_notified_at.is.null,last_notified_at.lt.${notificationCutoff.toISOString()}`)
    .order("last_checked_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get active users:", error);
    return [];
  }

  return data || [];
}
