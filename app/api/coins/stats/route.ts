import { NextRequest, NextResponse } from "next/server";
import { fetchCoinStats } from "@/lib/services/coin-stats-service";

/**
 * POST /api/coins/stats
 * Body: { addresses: string[] }
 * Returns: { stats: CoinStats[], cached: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { addresses } = (await request.json()) as { addresses: string[] };

    // Input validation
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: "addresses array is required" },
        { status: 400 }
      );
    }

    if (addresses.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 addresses per request" },
        { status: 400 }
      );
    }

    // Delegate to service
    const result = await fetchCoinStats(addresses);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching coin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin stats" },
      { status: 500 }
    );
  }
}
