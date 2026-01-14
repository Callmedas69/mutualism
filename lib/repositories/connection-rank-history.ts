import { supabase } from "@/lib/supabase/client";
import type {
  ConnectionRankHistoryRow,
  ConnectionRankHistoryInsert,
} from "@/lib/supabase/types";

/**
 * Connection Rank History Repository
 *
 * Tracks connection rank positions over time for:
 * - Detecting rank position changes (up/down/neutral)
 * - Daily snapshots per connection per type
 *
 * Per CLAUDE.md: Repository is data-access only, no business logic.
 */

type ConnectionType = "mutual" | "attention" | "influence";

// ============================================
// Insert/Update Operations
// ============================================

/**
 * Save rank snapshot for a batch of connections
 * Uses upsert to ensure one snapshot per connection per day
 */
export async function saveRankSnapshot(
  viewerFid: number,
  connections: Array<{ fid: number; rank: number; score: number }>,
  connectionType: ConnectionType
): Promise<boolean> {
  if (connections.length === 0) return true;

  const inserts: ConnectionRankHistoryInsert[] = connections.map((conn) => ({
    viewer_fid: viewerFid,
    connection_fid: conn.fid,
    connection_type: connectionType,
    rank: conn.rank,
    score: conn.score,
  }));

  // Use upsert with ignoreDuplicates to skip existing records
  // This avoids 409 errors when some connections already have today's snapshot
  const { error } = await supabase
    .from("connection_rank_history")
    .upsert(inserts, {
      onConflict: "viewer_fid,connection_fid,connection_type,recorded_date",
      ignoreDuplicates: true
    });

  if (error) {
    console.error("Failed to save rank snapshot:", error);
    return false;
  }

  return true;
}

// ============================================
// Query Operations
// ============================================

/**
 * Get the most recent ranks before today for comparison
 * Returns a map of connection_fid -> rank for quick lookup
 */
export async function getPreviousRanks(
  viewerFid: number,
  connectionType: ConnectionType
): Promise<Map<number, number>> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Get the most recent snapshot before today
  const { data, error } = await supabase
    .from("connection_rank_history")
    .select("connection_fid, rank, recorded_date")
    .eq("viewer_fid", viewerFid)
    .eq("connection_type", connectionType)
    .lt("recorded_date", today)
    .order("recorded_date", { ascending: false });

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("Failed to get previous ranks:", error);
    }
    return new Map();
  }

  if (!data || data.length === 0) {
    return new Map();
  }

  // Build map with only the most recent rank per connection
  const rankMap = new Map<number, number>();
  const seenFids = new Set<number>();

  for (const row of data) {
    if (!seenFids.has(row.connection_fid)) {
      rankMap.set(row.connection_fid, row.rank);
      seenFids.add(row.connection_fid);
    }
  }

  return rankMap;
}

/**
 * Check if snapshot already exists for today
 */
export async function hasSnapshotToday(
  viewerFid: number,
  connectionType: ConnectionType
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { count, error } = await supabase
    .from("connection_rank_history")
    .select("*", { count: "exact", head: true })
    .eq("viewer_fid", viewerFid)
    .eq("connection_type", connectionType)
    .eq("recorded_date", today);

  if (error) {
    console.error("Failed to check snapshot existence:", error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Delete old snapshots to prevent data bloat
 * Keeps only the last N days of history
 */
export async function cleanupOldSnapshots(
  daysToKeep: number = 30
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  const cutoffDateStr = cutoffDate.toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("connection_rank_history")
    .delete()
    .lt("recorded_date", cutoffDateStr)
    .select("id");

  if (error) {
    console.error("Failed to cleanup old snapshots:", error);
    return 0;
  }

  return data?.length ?? 0;
}

/**
 * Get rank history for a specific connection
 * Useful for detailed view/charts
 */
export async function getConnectionHistory(
  viewerFid: number,
  connectionFid: number,
  connectionType: ConnectionType,
  limit: number = 30
): Promise<ConnectionRankHistoryRow[]> {
  const { data, error } = await supabase
    .from("connection_rank_history")
    .select("*")
    .eq("viewer_fid", viewerFid)
    .eq("connection_fid", connectionFid)
    .eq("connection_type", connectionType)
    .order("recorded_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to get connection history:", error);
    return [];
  }

  return data ?? [];
}
