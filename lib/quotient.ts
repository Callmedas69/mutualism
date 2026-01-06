import type {
  ConnectionsAllResponse,
  ConnectionsResponse,
  ConnectionCategory,
  MutualUser,
  SharedMutualUser,
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

export interface SharedConnectionsResult {
  shared: SharedMutualUser[];
  count: number;
  userAlreadyKnowsTarget: boolean;
}

/**
 * Find shared mutual connections between two users
 * @param userFid - The logged-in user's FID
 * @param targetFid - The target user's FID
 * @returns Shared connections with both user and target scores
 */
export async function findSharedConnections(
  userFid: number,
  targetFid: number
): Promise<SharedConnectionsResult> {
  // Fetch mutuals for both users in parallel
  const [userMutuals, targetMutuals] = await Promise.all([
    fetchAllMutuals(userFid, 200),
    fetchAllMutuals(targetFid, 200),
  ]);

  // Check if user already knows target (target is in user's mutuals)
  const userAlreadyKnowsTarget = userMutuals.mutuals.some(
    (m) => m.fid === targetFid
  );

  // Create lookup for target's mutuals: fid → combined_score
  const targetScoreLookup = new Map(
    targetMutuals.mutuals.map((m) => [m.fid, m.combined_score])
  );

  // Find intersection and add target's score for each connector
  const shared: SharedMutualUser[] = userMutuals.mutuals
    .filter((m) => targetScoreLookup.has(m.fid) && m.fid !== targetFid)
    .map((m) => ({
      ...m,
      target_combined_score: targetScoreLookup.get(m.fid) || 0,
    }));

  // Sort by product of both scores (warmest path = strong on both sides)
  shared.sort((a, b) => {
    const scoreA = a.combined_score * a.target_combined_score;
    const scoreB = b.combined_score * b.target_combined_score;
    return scoreB - scoreA;
  });

  return {
    shared,
    count: shared.length,
    userAlreadyKnowsTarget,
  };
}
