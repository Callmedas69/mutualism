import type {
  ConnectionsAllResponse,
  ConnectionsResponse,
  ConnectionCategory,
} from "@/types/quotient";
import { API } from "@/lib/constants";

const API_KEY = process.env.QUOTIENT_API_KEY || "";

export async function fetchAllMutuals(
  fid: number,
  limit: number = 100
): Promise<ConnectionsAllResponse> {
  console.log("Fetching mutuals for fid:", fid, "API_KEY exists:", !!API_KEY);

  const res = await fetch(`${API.quotient}/v1/farcaster-connections-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fid, api_key: API_KEY }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Quotient API error:", res.status, errorText);
    throw new Error(`Failed to fetch mutuals: ${res.status} - ${errorText}`);
  }

  const data: ConnectionsAllResponse = await res.json();

  // Sort by combined_score (highest first) and limit results
  const topMutuals = data.mutuals
    .sort((a, b) => b.combined_score - a.combined_score)
    .slice(0, limit);

  return {
    ...data,
    mutuals: topMutuals,
    count: topMutuals.length,
  };
}

export async function fetchConnections(
  fid: number,
  categories?: ConnectionCategory[]
): Promise<ConnectionsResponse> {
  console.log("Fetching connections for fid:", fid, "categories:", categories);

  const res = await fetch(`${API.quotient}/v1/farcaster-connections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fid,
      api_key: API_KEY,
      categories: categories?.join(","),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Quotient API error:", res.status, errorText);
    throw new Error(`Failed to fetch connections: ${res.status} - ${errorText}`);
  }

  return res.json();
}
