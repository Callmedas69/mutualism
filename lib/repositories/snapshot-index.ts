import { supabase } from "@/lib/supabase/client";
import type { SnapshotIndexRow, SnapshotIndexInsert } from "@/lib/supabase/types";
import type { SnapshotView, TimeWindow } from "@/types/tokenize";

/**
 * Snapshot Index Repository
 *
 * Per PINATA_RESTRUCTURING.md:
 * - A snapshot is immutable
 * - Pinata stores artifacts
 * - The database stores pointers
 * - History is a gallery, not analytics
 */

// ============================================
// Insert Operations
// ============================================

/**
 * Insert a new snapshot record
 * Called after successful Pinata folder upload during tokenization
 */
export async function insertSnapshot(
  data: SnapshotIndexInsert
): Promise<SnapshotIndexRow | null> {
  const { data: row, error } = await supabase
    .from("snapshot_index")
    .insert({
      user_fid: data.user_fid,
      view: data.view,
      time_window: data.time_window,
      cid: data.cid,
      graph_version: data.graph_version || "v1",
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert snapshot:", error);
    return null;
  }

  return row;
}

// ============================================
// Query Operations
// ============================================

/**
 * Get all snapshots for a user, ordered by most recent first
 * For future History UI
 */
export async function getSnapshotsByFid(
  userFid: number,
  limit: number = 50
): Promise<SnapshotIndexRow[]> {
  const { data, error } = await supabase
    .from("snapshot_index")
    .select("*")
    .eq("user_fid", userFid)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get snapshots by fid:", error);
    return [];
  }

  return data || [];
}

/**
 * Get the latest snapshot for a specific user + view combination
 */
export async function getLatestSnapshot(
  userFid: number,
  view: SnapshotView
): Promise<SnapshotIndexRow | null> {
  const { data, error } = await supabase
    .from("snapshot_index")
    .select("*")
    .eq("user_fid", userFid)
    .eq("view", view)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // PGRST116 = no rows found, not an error
    if (error.code !== "PGRST116") {
      console.error("Failed to get latest snapshot:", error);
    }
    return null;
  }

  return data;
}

/**
 * Get a snapshot by its CID
 * Useful for verification or deduplication
 */
export async function getSnapshotByCid(
  cid: string
): Promise<SnapshotIndexRow | null> {
  const { data, error } = await supabase
    .from("snapshot_index")
    .select("*")
    .eq("cid", cid)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Failed to get snapshot by CID:", error);
    }
    return null;
  }

  return data;
}

/**
 * Get snapshots for a user filtered by view type
 */
export async function getSnapshotsByFidAndView(
  userFid: number,
  view: SnapshotView,
  limit: number = 20
): Promise<SnapshotIndexRow[]> {
  const { data, error } = await supabase
    .from("snapshot_index")
    .select("*")
    .eq("user_fid", userFid)
    .eq("view", view)
    .order("generated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get snapshots by fid and view:", error);
    return [];
  }

  return data || [];
}

/**
 * Count total snapshots for a user
 */
export async function countSnapshotsByFid(userFid: number): Promise<number> {
  const { count, error } = await supabase
    .from("snapshot_index")
    .select("*", { count: "exact", head: true })
    .eq("user_fid", userFid);

  if (error) {
    console.error("Failed to count snapshots:", error);
    return 0;
  }

  return count || 0;
}
