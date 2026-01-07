import { NextRequest, NextResponse } from "next/server";
import { upsertState } from "@/lib/repositories/user-graph-state";

/**
 * Track Graph Page Visit
 *
 * Called when a user views their graph.
 * Updates last_checked_at timestamp for reminder scheduling.
 *
 * Per CLAUDE.md: API route validates input, delegates to repository.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, mutualCount } = body;

    if (!fid || typeof fid !== "number") {
      return NextResponse.json(
        { error: "Invalid fid" },
        { status: 400 }
      );
    }

    // Update user's graph state
    const result = await upsertState(
      fid,
      typeof mutualCount === "number" ? mutualCount : undefined
    );

    if (!result) {
      return NextResponse.json(
        { error: "Failed to track visit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Track Visit] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
