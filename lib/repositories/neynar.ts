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
 */
export function findMatchingCast(
  casts: NeynarCast[],
  searchText: string,
  imageUrl: string,
  maxAgeMs: number = 120000
): NeynarCast | null {
  const now = Date.now();

  return (
    casts.find((cast) => {
      const castAge = now - new Date(cast.timestamp).getTime();
      const textMatch = cast.text
        .toLowerCase()
        .includes(searchText.toLowerCase());
      const embedMatch = cast.embeds?.some((e) => e.url?.includes(imageUrl));

      return castAge < maxAgeMs && textMatch && embedMatch;
    }) || null
  );
}
