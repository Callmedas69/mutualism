import { NextRequest, NextResponse } from "next/server";
import { searchUsers } from "@/lib/neynar";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  // Input validation (API layer responsibility per CLAUDE.md)
  // Require 3+ chars to reduce API calls (free tier: 6 req/60s)
  if (!query || query.length < 3) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await searchUsers(query, 5);
    return NextResponse.json({ users });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ users: [] });
  }
}
