import { NextRequest, NextResponse } from "next/server";
import { findSharedConnections } from "@/lib/quotient";
import { lookupUserByUsername } from "@/lib/neynar";
import type { SharedConnectionsResponse } from "@/types/quotient";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userFid: rawUserFid, targetUsername } = body;
    const userFid =
      typeof rawUserFid === "string" ? parseInt(rawUserFid, 10) : rawUserFid;

    // Validate user FID
    if (!userFid || isNaN(userFid)) {
      return NextResponse.json({ error: "Invalid user FID" }, { status: 400 });
    }

    // Validate target username
    if (!targetUsername || typeof targetUsername !== "string") {
      return NextResponse.json(
        { error: "Target username is required" },
        { status: 400 }
      );
    }

    // Check if user is searching for themselves
    const cleanUsername = targetUsername.replace(/^@/, "").trim().toLowerCase();

    // Lookup target user by username
    const targetUser = await lookupUserByUsername(cleanUsername);

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if searching for self
    if (targetUser.fid === userFid) {
      return NextResponse.json(
        { error: "That's you! Search for someone else." },
        { status: 400 }
      );
    }

    // Find shared connections
    const result = await findSharedConnections(userFid, targetUser.fid);

    const response: SharedConnectionsResponse = {
      target: {
        fid: targetUser.fid,
        username: targetUser.username,
        display_name: targetUser.display_name,
        pfp_url: targetUser.pfp_url,
      },
      shared: result.shared,
      count: result.count,
      userAlreadyKnowsTarget: result.userAlreadyKnowsTarget,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error finding shared connections:", error);
    return NextResponse.json(
      { error: "Failed to find shared connections" },
      { status: 500 }
    );
  }
}
