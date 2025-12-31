import { NextRequest, NextResponse } from "next/server";
import { fetchConnections } from "@/lib/quotient";
import type { ConnectionCategory } from "@/types/quotient";

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
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
