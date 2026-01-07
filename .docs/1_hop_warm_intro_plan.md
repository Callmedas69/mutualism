# 1-Hop Warm Intro Feature Plan

> **Feature**: Find mutual connections between you and a target user
> **Date**: 2026-01-06
> **Status**: Approved - Ready for Implementation

---

## Summary

Build a feature that finds mutual connections between the logged-in user and a target user. These shared connections can facilitate warm introductions.

**User Flow:**
```
1. User searches for target username
2. App fetches mutuals for BOTH users
3. App finds intersection (people who know both)
4. Display "You both know: Alice, Bob, Carol..."
```

---

## Architecture

```
UI (Search + Results)
  ↓
API Route (/api/connections/shared)
  ↓
Business Logic (intersection calculation)
  ↓
Repository (Quotient API calls for both users)
  ↓
Quotient API
```

---

## Implementation Steps

### Phase 1: User Lookup API

Need to resolve username → FID for the target user.

**Using Neynar API:**
```
GET https://api.neynar.com/v2/farcaster/user/by_username?username={username}
```

---

### Phase 2: Backend API Route

**File:** `app/api/connections/shared/route.ts`

```typescript
// POST /api/connections/shared
// Body: { targetUsername: string }
// Returns: { target: User, sharedConnections: MutualUser[], count: number }

1. Get logged-in user's FID from session/auth
2. Resolve targetUsername → targetFid (via Neynar)
3. Fetch mutuals for userFid (existing fetchAllMutuals)
4. Fetch mutuals for targetFid (same function)
5. Find intersection by FID
6. Sort by combined_score (highest first = best connector)
7. Return shared connections
```

---

### Phase 3: Service Layer

**File:** `lib/quotient.ts` - Add new function:

```typescript
export async function findSharedConnections(
  userFid: number,
  targetFid: number
): Promise<SharedConnectionsResult> {
  const [userMutuals, targetMutuals] = await Promise.all([
    fetchAllMutuals(userFid, 200),
    fetchAllMutuals(targetFid, 200)
  ]);

  // Create lookup map for target's mutuals
  const targetMutualFids = new Set(targetMutuals.mutuals.map(m => m.fid));

  // Find intersection
  const shared = userMutuals.mutuals.filter(m => targetMutualFids.has(m.fid));

  // Sort by user's combined_score (best connectors first)
  shared.sort((a, b) => b.combined_score - a.combined_score);

  return { shared, count: shared.length };
}
```

---

### Phase 4: User Lookup Service

**File:** `lib/neynar.ts` (new file)

```typescript
const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function lookupUserByUsername(username: string): Promise<FarcasterUser | null> {
  const res = await fetch(
    `https://api.neynar.com/v2/farcaster/user/by_username?username=${username}`,
    { headers: { 'x-api-key': NEYNAR_API_KEY } }
  );

  if (!res.ok) return null;
  const data = await res.json();
  return {
    fid: data.user.fid,
    username: data.user.username,
    pfp_url: data.user.pfp_url
  };
}
```

---

### Phase 5: Types

**File:** `types/quotient.d.ts` - Add:

```typescript
export interface SharedConnectionsResponse {
  target: {
    fid: number;
    username: string;
    pfp_url: string | null;
  };
  shared: MutualUser[];
  count: number;
}
```

---

### Phase 6: React Hook

**File:** `hooks/useSharedConnections.ts`

```typescript
export function useSharedConnections() {
  const [targetUsername, setTargetUsername] = useState("");
  const [result, setResult] = useState<SharedConnectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (username: string) => {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/connections/shared', {
      method: 'POST',
      body: JSON.stringify({ targetUsername: username })
    });

    if (!res.ok) {
      setError("User not found or no shared connections");
      setLoading(false);
      return;
    }

    setResult(await res.json());
    setLoading(false);
  };

  return { targetUsername, setTargetUsername, result, loading, error, search };
}
```

---

### Phase 7: UI Component

**File:** `components/graph/SharedConnections.tsx`

```
┌─────────────────────────────────────────┐
│  Find who can introduce you             │
│  ┌─────────────────────┐ ┌────────┐    │
│  │ @username           │ │ Search │    │
│  └─────────────────────┘ └────────┘    │
├─────────────────────────────────────────┤
│  You both know 5 people                 │
│                                         │
│  ┌─────┐ alice.eth         Score: 0.85 │
│  │ pfp │ Rank #3 in your network       │
│  └─────┘                                │
│                                         │
│  ┌─────┐ bob              Score: 0.72  │
│  │ pfp │ Rank #7 in your network       │
│  └─────┘                                │
│                                         │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `lib/neynar.ts` | Create | User lookup by username |
| `lib/quotient.ts` | Modify | Add findSharedConnections |
| `app/api/connections/shared/route.ts` | Create | API endpoint |
| `types/quotient.d.ts` | Modify | Add SharedConnectionsResponse |
| `hooks/useSharedConnections.ts` | Create | Client-side hook |
| `components/graph/SharedConnections.tsx` | Create | UI component |
| `components/graph/ConnectionTabs.tsx` | Modify | Add new tab or section |
| `.env.local` | Modify | Add NEYNAR_API_KEY |

---

## Prerequisites

1. **Neynar API Key** - Get free tier from https://console.neynar.com
2. Add to `.env.local`:
   ```
   NEYNAR_API_KEY=your_key_here
   ```

---

## Edge Cases

| Case | Handling |
|------|----------|
| Target user not found | Show "User not found" error |
| No shared connections | Show "No mutual connections found" |
| Target is already a mutual | Highlight "You already know this person!" |
| Searching for self | Block with "That's you!" message |
| Rate limiting | Debounce search, show error if hit |

---

## Future Enhancements (Out of Scope)

- 2-hop connections (friend of friend of friend)
- Graph visualization of the connection path
- "Request intro" CTA that composes a cast
- Shared channels display ("You both hang out in: /base, /nouns")

---

## Implementation Checklist

- [ ] Get Neynar API key
- [ ] Add NEYNAR_API_KEY to .env.local
- [ ] Create lib/neynar.ts
- [ ] Add findSharedConnections to lib/quotient.ts
- [ ] Add types to types/quotient.d.ts
- [ ] Create API route
- [ ] Create React hook
- [ ] Create UI component
- [ ] Integrate into ConnectionTabs
- [ ] Test edge cases
- [ ] Build verification
