# Pinata Restructuring Implementation Plan

> **Status**: ✅ COMPLETE
> **Created**: 2026-01-07
> **Completed**: 2026-01-07

## Summary
Implement folder-per-snapshot structure for Pinata uploads per `PINATA_RESTRUCTURING.md`.

## User Decisions
- **Scope**: Pinata only (no database/SnapshotIndex)
- **Legacy pins**: Clean slate (user will delete existing)
- **Flows**: Both tokenize AND share

---

## Target Structure

```
mutual-circle_fid22420_last30d_2026-01-05T18-42/
├── image.png
└── metadata.json
```

**Naming**: `{view}_fid{FID}_{timeWindow}_{ISO-datetime}`

---

## Files to Modify

### 1. `types/tokenize.ts`
- Add new types: `SnapshotView`, `TimeWindow`, `SnapshotMetadata`
- Remove `nodeCount` from `CoinMetadata.properties`
- Remove `nodeCount` from `TokenizeGraphData`
- Add `SnapshotUploadRequest` and `SnapshotUploadResponse` interfaces

### 2. `lib/services/coin-generator.ts`
- Remove `nodeCount` parameter from `generateMetadata()`
- Add `generateSnapshotMetadata()` - new v1 compliant function
- Add `mapGraphTypeToView()` - maps "mutuals" → "mutual_circle"
- Add `generateFolderName()` - creates folder naming string

### 3. `app/api/tokenize/route.ts`
- Rewrite to handle folder upload flow:
  1. Receive FormData with image + metadata params
  2. Upload image first to get CID
  3. Generate metadata JSON with image CID
  4. Upload folder using `pinata.upload.public.fileArray([image, metadata]).name(folderName)`
  5. Return folder CID and metadata URI

### 4. `lib/repositories/ipfs.ts`
- Add new `uploadSnapshot()` function (single combined upload)
- Keep legacy functions temporarily for backward compat
- Update `UploadResult` → `SnapshotUploadResult`

### 5. `lib/pinata.ts`
- Update exports to include new functions

### 6. `components/graph/TokenizeModal.tsx`
- Replace separate upload calls with single `uploadSnapshot()`
- Remove `nodeCount` from data prep
- Add `timeWindow` parameter (default: "last_30d")

### 7. `components/graph/MiniAppTokenizeModal.tsx`
- Same changes as TokenizeModal

### 8. `components/graph/ShareGraphButton.tsx`
- **Decision (Updated)**: Full snapshot upload (folder + DB record) for history tracking
- Uses `uploadSnapshot()` to create folder with image.png + metadata.json
- Creates Supabase record for every share
- Farcaster embed uses `{gatewayUrl}/image.png` for direct image access
- Enables history comparison feature without requiring tokenization

### 9. `components/graph/ConnectionGraph.tsx`
- Remove `nodeCount` from `tokenizeData` preparation

---

## Metadata Schema (v1)

```json
{
  "name": "Mutual Circle of @username",
  "description": "A snapshot of real interactions...",
  "image": "ipfs://<PNG_CID>",
  "properties": {
    "category": "mutualism",
    "fid": 22420,
    "view": "mutual_circle",
    "timeWindow": "last_30d",
    "generatedAt": "2026-01-05T18:42:00Z",
    "graphVersion": "v1",
    "source": "Quotient API"
  }
}
```

**FORBIDDEN fields**: `nodeCount`, totals, rankings, scores

---

## Implementation Order

0. ✅ **Documentation** - Save this plan to `.docs/PINATA_IMPLEMENTATION.md`
1. ✅ **Types** - `types/tokenize.ts` (new types, remove nodeCount)
2. ✅ **Service** - `lib/services/coin-generator.ts` (new functions)
3. ✅ **API** - `app/api/tokenize/route.ts` (folder upload)
4. ✅ **Repository** - `lib/repositories/ipfs.ts` (uploadSnapshot)
5. ✅ **Re-exports** - `lib/pinata.ts`
6. ✅ **Components** - TokenizeModal, MiniAppTokenizeModal, ShareGraphButton
7. ✅ **Graph** - ConnectionGraph (remove nodeCount)

---

## Key Technical Notes

### Pinata SDK Folder Upload
```typescript
const upload = await pinata.upload.public
  .fileArray([imageFile, metadataFile])
  .name(folderName);
// Returns { cid: "Qm..." } for the folder
```

### View Mapping
| Current | New |
|---------|-----|
| mutuals | mutual_circle |
| attention | attention_circle |
| influence | influence_circle |

### TimeWindow Values
- `last_7d`
- `last_30d`
- `last_90d`
- `all_time`

---

## Testing Checklist
- [ ] Folder appears in Pinata with correct naming
- [ ] Folder contains exactly `image.png` and `metadata.json`
- [ ] Metadata has NO forbidden fields
- [ ] Gateway URL resolves correctly
- [ ] Tokenize flow creates Zora coin successfully
- [ ] Share flow works (image visible in Farcaster)

---

# Part 2: Supabase SnapshotIndex (Added 2026-01-07)

> **Status**: ✅ COMPLETE

## Summary
Implemented SnapshotIndex database table using Supabase to track snapshot pointers.

## Files Created

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Supabase client (server-side) |
| `lib/supabase/types.ts` | TypeScript types for database |
| `lib/repositories/snapshot-index.ts` | Full CRUD repository |

## File Modified

| File | Change |
|------|--------|
| `app/api/tokenize/route.ts` | Insert snapshot record after folder upload |

## Repository Functions

- `insertSnapshot()` - Insert new snapshot record
- `getSnapshotsByFid()` - Get all snapshots for a user
- `getLatestSnapshot()` - Get most recent for user/view
- `getSnapshotByCid()` - Get by CID
- `getSnapshotsByFidAndView()` - Filter by user and view
- `countSnapshotsByFid()` - Count user's snapshots

## SQL Schema (Run in Supabase Dashboard)

```sql
CREATE TABLE snapshot_index (
  snapshot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_fid INTEGER NOT NULL,
  view TEXT NOT NULL CHECK (view IN ('mutual_circle', 'attention_circle', 'influence_circle')),
  time_window TEXT NOT NULL CHECK (time_window IN ('last_7d', 'last_30d', 'last_90d', 'all_time')),
  cid TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graph_version TEXT NOT NULL DEFAULT 'v1',
  CONSTRAINT valid_cid CHECK (cid ~ '^[a-zA-Z0-9]+$')
);

CREATE INDEX idx_snapshot_index_user_fid ON snapshot_index(user_fid);
CREATE INDEX idx_snapshot_index_generated_at ON snapshot_index(generated_at DESC);
CREATE INDEX idx_snapshot_index_user_view ON snapshot_index(user_fid, view, generated_at DESC);

ALTER TABLE snapshot_index ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON snapshot_index FOR ALL USING (true) WITH CHECK (true);
```

## Testing Checklist
- [ ] Run SQL in Supabase dashboard
- [ ] Tokenize creates snapshot record
- [ ] Query by fid returns records
- [ ] No forbidden fields stored

---

# Part 3: Hybrid Share Flow (Added 2026-01-07)

> **Status**: ✅ COMPLETE

## Summary
Changed Share button to create full snapshot (folder + DB record) instead of image-only upload.

## Business Rationale
- No Tokenize launch initially (waiting for traction)
- Need history tracking for comparison features
- Single Share button does: Snapshot → DB record → Farcaster compose

## Changes Made

| File | Change |
|------|--------|
| `components/graph/ShareGraphButton.tsx` | `uploadImageToIPFS` → `uploadSnapshot` |

## New Share Flow
```
User clicks Share
    ↓
Generate PNG blob
    ↓
uploadSnapshot() → creates folder + DB record
    ↓
composeCast() with image URL
```

## UX
- Button text: "Share" → "Saving..." → "Opening..." → "Shared!"
- Every share creates history record automatically

---

# Part 4: Security Hardening (Added 2026-01-07)

> **Status**: ✅ COMPLETE

## Summary
Added rate limiting and FID consistency checks to prevent abuse.

## Files Created/Modified

| File | Change |
|------|--------|
| `lib/middleware/rate-limit.ts` | NEW - In-memory rate limiter |
| `app/api/tokenize/route.ts` | Added FID header check + rate limit |
| `lib/repositories/ipfs.ts` | Pass x-farcaster-fid header |

## Security Measures

| Protection | Implementation |
|------------|----------------|
| Rate limit | 5 snapshots/hour per FID |
| FID consistency | Header must match body |
| File size | 10MB max (existing) |
| File type | image/* MIME check (existing) |

## Rate Limiter

```typescript
// lib/middleware/rate-limit.ts
checkRateLimit(fid: number): { allowed: boolean; remaining: number; resetAt: number }
```

- In-memory Map (suitable for single instance)
- 5 requests per hour per FID
- Auto-resets after window expires

## Deferred Security (Pre-Launch)

- [ ] Cryptographic FID verification (signed messages)
- [ ] Move to Redis for multi-instance rate limiting

---

# Part 5: Architecture Refactor (Added 2026-01-07)

> **Status**: ✅ COMPLETE

## Summary
Refactored to comply with CLAUDE.md architecture rules.

## New Architecture

```
UI (ShareGraphButton)
  ↓
Client API Wrapper (lib/repositories/ipfs.ts)
  ↓
API Route (app/api/tokenize/route.ts) - validation + routing only
  ↓
Use Case (lib/usecases/create-snapshot.ts) - orchestration
  ↓
Repositories:
  ├── lib/repositories/pinata.ts (Pinata SDK - server)
  └── lib/repositories/snapshot-index.ts (Supabase)
  ↓
Infrastructure (Pinata, Supabase)
```

## Files Created

| File | Purpose |
|------|---------|
| `lib/repositories/pinata.ts` | Pinata SDK wrapper (server-side) |
| `lib/usecases/create-snapshot.ts` | Snapshot creation orchestration |

## Files Modified

| File | Change |
|------|--------|
| `app/api/tokenize/route.ts` | Simplified to validation + delegation |

## Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| API Route | Validate, check auth/rate limit, delegate |
| Use Case | Orchestrate workflow, call repositories |
| Pinata Repository | Upload files to IPFS |
| Snapshot Repository | Insert/query database |

## Compliance

| Rule | Status |
|------|--------|
| API → External API direct | ✅ Fixed (uses repository) |
| Business logic in API | ✅ Fixed (moved to use case) |
| Repository is dumb | ✅ Compliant |
| Unidirectional flow | ✅ Compliant |
