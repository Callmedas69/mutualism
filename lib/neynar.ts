// Neynar API client for Farcaster user lookup

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "";
const NEYNAR_API_URL = "https://api.neynar.com";

// Simple in-memory cache to reduce API calls (free tier: 6 req/60s)
const userCache = new Map<string, { user: NeynarUser | null; timestamp: number }>();
const searchCache = new Map<string, { users: SearchUser[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string | null;
  pfp_url: string | null;
  follower_count: number;
  following_count: number;
}

interface NeynarUserResponse {
  user: {
    fid: number;
    username: string;
    display_name: string;
    pfp_url: string;
    follower_count: number;
    following_count: number;
  };
}

/**
 * Lookup a Farcaster user by username
 * @param username - The username to lookup (without @)
 * @returns User object or null if not found
 */
export async function lookupUserByUsername(
  username: string
): Promise<NeynarUser | null> {
  // Remove @ if present
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();

  if (!cleanUsername) {
    return null;
  }

  // Check cache first
  const cached = userCache.get(cleanUsername);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.user;
  }

  try {
    const res = await fetch(
      `${NEYNAR_API_URL}/v2/farcaster/user/by_username?username=${encodeURIComponent(cleanUsername)}`,
      {
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        userCache.set(cleanUsername, { user: null, timestamp: Date.now() });
        return null;
      }
      console.error("Neynar API error:", res.status, await res.text());
      return null;
    }

    const data: NeynarUserResponse = await res.json();

    const user: NeynarUser = {
      fid: data.user.fid,
      username: data.user.username,
      display_name: data.user.display_name || null,
      pfp_url: data.user.pfp_url || null,
      follower_count: data.user.follower_count,
      following_count: data.user.following_count,
    };

    // Cache the result
    userCache.set(cleanUsername, { user, timestamp: Date.now() });

    return user;
  } catch (error) {
    console.error("Neynar lookup error:", error);
    return null;
  }
}

export interface SearchUser {
  fid: number;
  username: string;
  display_name: string | null;
  pfp_url: string | null;
}

interface NeynarSearchResponse {
  result: {
    users: Array<{
      fid: number;
      username: string;
      display_name: string;
      pfp_url: string;
    }>;
  };
}

/**
 * Search for Farcaster users by query
 * Tries search API first, falls back to exact username lookup on free tier
 * @param query - The search query (username or display name)
 * @param limit - Maximum number of results (default 5)
 * @returns Array of matching users
 */
export async function searchUsers(
  query: string,
  limit: number = 5
): Promise<SearchUser[]> {
  const cleanQuery = query.replace(/^@/, "").trim().toLowerCase();

  // Require 3+ chars to reduce API calls (free tier: 6 req/60s)
  if (!cleanQuery || cleanQuery.length < 3) {
    return [];
  }

  // Check cache first
  const cacheKey = `${cleanQuery}:${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.users;
  }

  try {
    // Try search API first (requires paid plan)
    const res = await fetch(
      `${NEYNAR_API_URL}/v2/farcaster/user/search?q=${encodeURIComponent(cleanQuery)}&limit=${limit}`,
      {
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.ok) {
      const data: NeynarSearchResponse = await res.json();
      const users = data.result.users.map((user) => ({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name || null,
        pfp_url: user.pfp_url || null,
      }));
      searchCache.set(cacheKey, { users, timestamp: Date.now() });
      return users;
    }

    // Fallback: Try exact username lookup (free tier, uses its own cache)
    const user = await lookupUserByUsername(cleanQuery);
    if (user) {
      const users = [
        {
          fid: user.fid,
          username: user.username,
          display_name: user.display_name,
          pfp_url: user.pfp_url,
        },
      ];
      searchCache.set(cacheKey, { users, timestamp: Date.now() });
      return users;
    }

    // Cache empty result too
    searchCache.set(cacheKey, { users: [], timestamp: Date.now() });
    return [];
  } catch (error) {
    console.error("Neynar search error:", error);
    // Try exact match as last resort
    try {
      const user = await lookupUserByUsername(cleanQuery);
      if (user) {
        return [
          {
            fid: user.fid,
            username: user.username,
            display_name: user.display_name,
            pfp_url: user.pfp_url,
          },
        ];
      }
    } catch {
      // Ignore fallback errors
    }
    return [];
  }
}
