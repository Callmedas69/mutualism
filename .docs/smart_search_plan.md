# Smart Search Plan for Warm Intro

## Overview
Enhance the Warm Intro search with two features:
1. **Recent Searches** - Remember past searches (Phase 1)
2. **Autocomplete** - Type-ahead username suggestions (Phase 2)

---

## Phase 1: Recent Searches

### Goal
Show user's last 5 searches for quick re-access.

### UI Design
```
┌─────────────────────────────────────┐
│ 🔍 [@username____________] [Search] │
├─────────────────────────────────────┤
│ Recent:                             │
│ @dwr • @vitalik • @jesse.base.eth   │
└─────────────────────────────────────┘
```

### Implementation

#### 1. Storage Hook (`hooks/useRecentSearches.ts`)
```typescript
interface RecentSearch {
  username: string;
  pfp_url: string | null;
  fid: number;
  timestamp: number;
}

function useRecentSearches(maxItems = 5) {
  // localStorage key: "warmintro_recent_searches"
  // Returns: { recent, addRecent, clearRecent }
}
```

#### 2. UI Changes (`SharedConnections.tsx`)
- Show recent searches below search input (only when no results)
- Click on recent → populate input and auto-search
- Store search after successful result

#### 3. Storage Format
```json
{
  "warmintro_recent_searches": [
    { "username": "dwr", "pfp_url": "...", "fid": 3, "timestamp": 1704567890 }
  ]
}
```

### Files to Create/Modify
| File | Action |
|------|--------|
| `hooks/useRecentSearches.ts` | Create |
| `components/graph/SharedConnections.tsx` | Modify |

### Effort
~2 hours

---

## Phase 2: Autocomplete

### Goal
Show matching usernames as user types.

### UI Design
```
┌─────────────────────────────────────┐
│ 🔍 [@dw___________________] [Search]│
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🖼 @dwr (Dan Romero)            │ │
│ │ 🖼 @dwarkesh (Dwarkesh Patel)   │ │
│ │ 🖼 @dweb                        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Implementation

#### 1. Neynar API Endpoint
```
GET /v2/farcaster/user/search?q={query}&limit=5
```

Response:
```json
{
  "result": {
    "users": [
      { "fid": 3, "username": "dwr", "display_name": "Dan Romero", "pfp_url": "..." }
    ]
  }
}
```

#### 2. Search Hook (`hooks/useUserSearch.ts`)
```typescript
function useUserSearch() {
  // Debounced search (300ms)
  // Returns: { results, loading, search, clear }
}
```

#### 3. API Route (`app/api/users/search/route.ts`)
Per CLAUDE.md: API layer handles "input validation"
```typescript
// GET /api/users/search?q=dwr
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  // Input validation (API layer responsibility)
  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // Sanitize: remove @ prefix, trim whitespace
  const cleanQuery = query.replace(/^@/, "").trim();

  // Proxy to Neynar (hide API key)
  const res = await fetch(`${NEYNAR_API}/v2/farcaster/user/search?q=${cleanQuery}&limit=5`, {
    headers: { "x-api-key": NEYNAR_API_KEY }
  });

  // ... return results
}
```

#### 4. Autocomplete Component (`components/graph/UserAutocomplete.tsx`)
```typescript
interface UserAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (user: { username: string; fid: number }) => void;
}
```

### Keyboard Navigation
| Key | Action |
|-----|--------|
| ↓ / ↑ | Navigate suggestions |
| Enter | Select highlighted |
| Escape | Close dropdown |

### Accessibility
- `role="combobox"` on input
- `role="listbox"` on dropdown
- `aria-activedescendant` for selection
- `aria-expanded` state

### Files to Create/Modify
| File | Action |
|------|--------|
| `hooks/useUserSearch.ts` | Create |
| `app/api/users/search/route.ts` | Create |
| `components/graph/UserAutocomplete.tsx` | Create |
| `components/graph/SharedConnections.tsx` | Modify |

### Effort
~4-6 hours

---

## Implementation Order

```
Phase 1: Recent Searches
├── 1.1 Create useRecentSearches hook
├── 1.2 Add recent searches UI
├── 1.3 Save searches on success
└── 1.4 Test & polish

Phase 2: Autocomplete
├── 2.1 Create API route for user search
├── 2.2 Create useUserSearch hook with debounce
├── 2.3 Create UserAutocomplete component
├── 2.4 Add keyboard navigation
├── 2.5 Add accessibility attributes
└── 2.6 Test & polish
```

---

## Technical Considerations

### Rate Limiting
- Debounce autocomplete: 300ms
- Cache results in memory (Map with TTL)
- Limit to 5 suggestions

### Mobile UX
- Dropdown positioned above keyboard
- Touch-friendly hit targets (44px min)
- Close dropdown on scroll

### Error Handling
Per CLAUDE.md: "Errors must be logged (developer), explained (user)"
- **Log errors** to console (developer visibility)
- **Show nothing** to user on autocomplete error (graceful degradation - autocomplete is non-critical)
- Don't block search if autocomplete fails
- Recent searches: show error toast if storage fails

---

## Dependencies
- Neynar API: `/v2/farcaster/user/search`
- localStorage for recent searches
- No new npm packages required

---

## Success Metrics
- Reduced typo errors in searches
- Faster time to search (click vs type)
- Increased search completion rate

---

## Architecture Compliance (CLAUDE.md)

### Phase 1: Recent Searches
```
UI (SharedConnections.tsx)
  ↓
Hook (useRecentSearches.ts) ← Local state management
  ↓
localStorage ← Client-side storage (not external infrastructure)
```
✅ **Compliant**: localStorage is client-side UI state, acceptable per "Use local state by default"

### Phase 2: Autocomplete
```
UI (UserAutocomplete.tsx)
  ↓
Hook (useUserSearch.ts) ← Debounce is UI concern, not business logic
  ↓
API Route (/api/users/search) ← Input validation here
  ↓
Neynar API ← External infrastructure
```
✅ **Compliant**: Follows UI → API → Infrastructure flow

### Layer Responsibilities
| Layer | Component | Responsibility |
|-------|-----------|----------------|
| UI | UserAutocomplete | Display dropdown, handle interactions |
| UI | useUserSearch | Manage search state, debounce |
| API | /api/users/search | Validate input, proxy request |
| Infra | Neynar API | Return user data |

### Rules Followed
- ✅ KISS: Minimal files, clear purpose
- ✅ Accessibility: Keyboard nav, ARIA attributes
- ✅ Mobile: 44px touch targets
- ✅ Error handling: Log + graceful degradation
- ✅ No business logic in UI or API layers
