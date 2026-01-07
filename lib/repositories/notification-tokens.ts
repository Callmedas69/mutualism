import { supabase } from "@/lib/supabase/client";
import type {
  NotificationTokenRow,
  NotificationTokenInsert,
} from "@/lib/supabase/types";

/**
 * Notification Tokens Repository
 *
 * Stores Farcaster push notification tokens received via webhook.
 * Tokens are user-specific and used to send push notifications.
 *
 * Per CLAUDE.md: Repository is data-access only, no business logic.
 */

// ============================================
// Insert/Update Operations
// ============================================

/**
 * Upsert a notification token for a user
 * Called when user enables notifications (webhook event)
 */
export async function upsertToken(
  fid: number,
  token: string,
  url: string
): Promise<NotificationTokenRow | null> {
  const { data, error } = await supabase
    .from("notification_tokens")
    .upsert(
      {
        fid,
        token,
        url,
        enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "fid" }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to upsert notification token:", error);
    return null;
  }

  return data;
}

/**
 * Disable notifications for a user (soft delete)
 * Called when user disables notifications
 */
export async function disableToken(fid: number): Promise<boolean> {
  const { error } = await supabase
    .from("notification_tokens")
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("fid", fid);

  if (error) {
    console.error("Failed to disable notification token:", error);
    return false;
  }

  return true;
}

/**
 * Delete a notification token (hard delete)
 * Called when user removes the miniapp
 */
export async function deleteToken(fid: number): Promise<boolean> {
  const { error } = await supabase
    .from("notification_tokens")
    .delete()
    .eq("fid", fid);

  if (error) {
    console.error("Failed to delete notification token:", error);
    return false;
  }

  return true;
}

// ============================================
// Query Operations
// ============================================

/**
 * Get notification token for a specific user
 */
export async function getToken(fid: number): Promise<NotificationTokenRow | null> {
  const { data, error } = await supabase
    .from("notification_tokens")
    .select("*")
    .eq("fid", fid)
    .eq("enabled", true)
    .single();

  if (error) {
    // PGRST116 = no rows found, not an error
    if (error.code !== "PGRST116") {
      console.error("Failed to get notification token:", error);
    }
    return null;
  }

  return data;
}

/**
 * Get all enabled notification tokens
 * Used for batch notifications (e.g., cron jobs)
 */
export async function getAllEnabledTokens(): Promise<NotificationTokenRow[]> {
  const { data, error } = await supabase
    .from("notification_tokens")
    .select("*")
    .eq("enabled", true);

  if (error) {
    console.error("Failed to get all enabled tokens:", error);
    return [];
  }

  return data || [];
}

/**
 * Get tokens for multiple FIDs
 * Used for targeted batch notifications
 */
export async function getTokensByFids(
  fids: number[]
): Promise<NotificationTokenRow[]> {
  if (fids.length === 0) return [];

  const { data, error } = await supabase
    .from("notification_tokens")
    .select("*")
    .in("fid", fids)
    .eq("enabled", true);

  if (error) {
    console.error("Failed to get tokens by fids:", error);
    return [];
  }

  return data || [];
}

/**
 * Count total enabled tokens
 */
export async function countEnabledTokens(): Promise<number> {
  const { count, error } = await supabase
    .from("notification_tokens")
    .select("*", { count: "exact", head: true })
    .eq("enabled", true);

  if (error) {
    console.error("Failed to count enabled tokens:", error);
    return 0;
  }

  return count || 0;
}
