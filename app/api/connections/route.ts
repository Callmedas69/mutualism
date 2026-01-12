import { NextRequest, NextResponse } from "next/server";
import { fetchConnections } from "@/lib/quotient";
import {
  getPreviousRanks,
  saveRankSnapshot,
} from "@/lib/repositories/connection-rank-history";
import type { ConnectionCategory, ConnectionUser } from "@/types/quotient";

/**
 * Calculate rank changes by comparing current ranks to previous snapshot
 * Positive = moved up (lower rank number), Negative = moved down, 0 = same, null = new
 */
function calculateRankChanges(
  connections: ConnectionUser[],
  previousRanks: Map<number, number>
): ConnectionUser[] {
  return connections.map((conn) => {
    const previousRank = previousRanks.get(conn.fid);

    if (previousRank === undefined) {
      // New connection - no previous data
      return { ...conn, rank_change: null };
    }

    // Calculate change: previous - current (positive = moved up)
    const rankChange = previousRank - conn.rank;
    return { ...conn, rank_change: rankChange };
  });
}

export async function POST(request: NextRequest) {
  try {
    // Handle aborted requests (empty body from AbortController)
    let body;
    try {
      body = await request.json();
    } catch {
      // Request was likely aborted - return empty response
      return NextResponse.json({ attention: [], influence: [] });
    }

    const { fid: rawFid, categories } = body;
    const fid = typeof rawFid === "string" ? parseInt(rawFid, 10) : rawFid;

    if (!fid || isNaN(fid)) {
      return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
    }

    const categoryArray = categories
      ? (categories.split(",") as ConnectionCategory[])
      : undefined;

    console.log("Fetching connections for fid:", fid, "categories:", categoryArray);
    const data = await fetchConnections(fid, categoryArray);

    // Process attention connections
    let attentionWithChanges = data.attention;
    if (data.attention && data.attention.length > 0) {
      const previousAttentionRanks = await getPreviousRanks(fid, "attention");
      attentionWithChanges = calculateRankChanges(data.attention, previousAttentionRanks);

      // Save current snapshot (fire and forget)
      const attentionToSave = data.attention.map((c) => ({
        fid: c.fid,
        rank: c.rank,
        score: c.score,
      }));
      saveRankSnapshot(fid, attentionToSave, "attention").catch((err) => {
        console.error("Failed to save attention rank snapshot:", err);
      });
    }

    // Process influence connections
    let influenceWithChanges = data.influence;
    if (data.influence && data.influence.length > 0) {
      const previousInfluenceRanks = await getPreviousRanks(fid, "influence");
      influenceWithChanges = calculateRankChanges(data.influence, previousInfluenceRanks);

      // Save current snapshot (fire and forget)
      const influenceToSave = data.influence.map((c) => ({
        fid: c.fid,
        rank: c.rank,
        score: c.score,
      }));
      saveRankSnapshot(fid, influenceToSave, "influence").catch((err) => {
        console.error("Failed to save influence rank snapshot:", err);
      });
    }

    return NextResponse.json({
      ...data,
      attention: attentionWithChanges,
      influence: influenceWithChanges,
    });
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
