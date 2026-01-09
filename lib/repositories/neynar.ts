/**
 * Neynar Repository
 *
 * Abstracts Neynar API calls for Farcaster data.
 * Used for cast verification after sharing.
 */

const NEYNAR_API_URL = "https://api.neynar.com/v2/farcaster";

export interface NeynarCast {
  hash: string;
  author: { fid: number; username: string };
  text: string;
  timestamp: string;
  embeds: Array<{ url?: string }>;
}

/**
 * Fetches recent casts from a user
 */
export async function getUserRecentCasts(
  fid: number,
  limit: number = 10
): Promise<NeynarCast[]> {
  const apiKey = process.env.NEYNAR_API_KEY;
  if (!apiKey) {
    throw new Error("NEYNAR_API_KEY not configured");
  }

  const res = await fetch(
    `${NEYNAR_API_URL}/feed/user/casts?fid=${fid}&limit=${limit}`,
    {
      headers: { "x-api-key": apiKey },
      next: { revalidate: 0 }, // Don't cache
    }
  );

  if (!res.ok) {
    throw new Error(`Neynar API error: ${res.status}`);
  }

  const data = await res.json();
  return data.casts || [];
}

/**
 * Finds a matching cast by text content and embed URL
 * Uses CID matching for embeds since Warpcast may proxy/modify URLs
 */
export function findMatchingCast(
  casts: NeynarCast[],
  searchText: string,
  imageUrl: string,
  maxAgeMs: number = 120000
): NeynarCast | null {
  const now = Date.now();

  // Extract IPFS CID from URL for more reliable matching
  // CIDs start with 'baf' (CIDv1) or 'Qm' (CIDv0)
  const cidMatch = imageUrl.match(/\b(baf[a-z0-9]+|Qm[a-zA-Z0-9]+)\b/);
  const cid = cidMatch ? cidMatch[1] : null;

  return (
    casts.find((cast) => {
      const castAge = now - new Date(cast.timestamp).getTime();
      const textMatch = cast.text
        .toLowerCase()
        .includes(searchText.toLowerCase());

      // Match by CID if available, otherwise fall back to full URL
      const embedMatch = cid
        ? cast.embeds?.some((e) => e.url?.includes(cid))
        : cast.embeds?.some((e) => e.url?.includes(imageUrl));

      return castAge < maxAgeMs && textMatch && embedMatch;
    }) || null
  );
}
