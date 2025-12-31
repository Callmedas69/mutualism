import { NextRequest, NextResponse } from "next/server";
import { fetchAllMutuals } from "@/lib/quotient";

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
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching all mutuals:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
