import { NextRequest, NextResponse } from "next/server";
import { fetchAllMutuals } from "@/lib/quotient";
import {
  getPreviousRanks,
  saveRankSnapshot,
} from "@/lib/repositories/connection-rank-history";
import type { MutualUser } from "@/types/quotient";

/**
 * Calculate rank changes by comparing current ranks to previous snapshot
 * Positive = moved up (lower rank number), Negative = moved down, 0 = same, null = new
 */
function calculateRankChanges(
  mutuals: MutualUser[],
  previousRanks: Map<number, number>
): MutualUser[] {
  return mutuals.map((mutual) => {
    const previousRank = previousRanks.get(mutual.fid);

    if (previousRank === undefined) {
      // New connection - no previous data
      return { ...mutual, rank_change: null };
    }

    // Calculate change: previous - current (positive = moved up)
    const rankChange = previousRank - mutual.rank;
    return { ...mutual, rank_change: rankChange };
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
      return NextResponse.json({ mutuals: [], count: 0 });
    }

    const { fid: rawFid } = body;
    const fid = typeof rawFid === "string" ? parseInt(rawFid, 10) : rawFid;

    if (!fid || isNaN(fid)) {
      return NextResponse.json({ error: "Invalid FID" }, { status: 400 });
    }

    console.log("Fetching mutuals for fid:", fid);
    const data = await fetchAllMutuals(fid);

    // Get previous ranks for comparison
    const previousRanks = await getPreviousRanks(fid, "mutual");

    // Calculate rank changes
    const mutualsWithChanges = calculateRankChanges(data.mutuals, previousRanks);

    // Save current snapshot (fire and forget - don't block response)
    const connectionsToSave = data.mutuals.map((m) => ({
      fid: m.fid,
      rank: m.rank,
      score: m.combined_score,
    }));
    saveRankSnapshot(fid, connectionsToSave, "mutual").catch((err) => {
      console.error("Failed to save rank snapshot:", err);
    });

    return NextResponse.json({
      ...data,
      mutuals: mutualsWithChanges,
    });
  } catch (error) {
    console.error("Error fetching all mutuals:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
