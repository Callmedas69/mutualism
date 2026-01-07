# Architecture Audit Report: MUTUALISM

**Date**: 2026-01-05
**Scope**: Layer Separation, Business Logic Placement, Repository Pattern
**Compliance**: CLAUDE.md Application Architecture Rules
**Status**: FIXES IMPLEMENTED

---

## Implementation Status

| Finding | Status | Implementation |
|---------|--------|----------------|
| `/api/coins/stats` - Extract to service | FIXED | `lib/services/coin-stats-service.ts` |
| `/api/miniapp/webhook` - Extract to service | SKIPPED | Intentionally left as-is |
| `lib/zora.ts` - Split into layers | FIXED | `lib/services/coin-generator.ts` + `lib/sdk/zora.ts` |
| `lib/pinata.ts` - Split into layers | FIXED | `lib/repositories/ipfs.ts` + `lib/utils/with-retry.ts` |
| ETH price fetch - Extract to hook | FIXED | `hooks/useEthPrice.ts` |
| Error formatter - Extract to lib | FIXED | `lib/errors.ts` |
| Registry signature - Extract to lib | FIXED | `lib/registry.ts` - `requestRegistrySignature()` |

---

## New Architecture Structure

```
lib/
├── services/                  [NEW]
│   ├── coin-stats-service.ts  # Caching, Zora SDK, data transform
│   └── coin-generator.ts      # Business logic (name/symbol generation)
├── sdk/                       [NEW]
│   └── zora.ts                # SDK wrapper (prepareCoinCreation, etc.)
├── repositories/              [NEW]
│   └── ipfs.ts                # IPFS upload functions
├── utils/
│   ├── lru-cache.ts
│   └── with-retry.ts          [NEW] Generic retry utility
├── errors.ts                  [NEW] Error formatters
├── zora.ts                    # Re-exports for backwards compatibility
├── pinata.ts                  # Re-exports for backwards compatibility
└── registry.ts                # Added requestRegistrySignature()

hooks/
└── useEthPrice.ts             [NEW] ETH price hook with cache
```

---

## Executive Summary (Post-Fix)

| Layer | Status | Notes |
|-------|--------|-------|
| **UI Components** | PASS | Zero violations |
| **API Routes** | MOSTLY PASS | 5/6 clean, webhook intentionally unchanged |
| **lib/ Structure** | PASS | Proper layer separation implemented |
| **Repository Pattern** | PASS | `lib/repositories/` created |
| **Business Logic** | PASS | Consolidated in `lib/services/` |

---

## Original Findings (For Reference)

### 1. API Routes Audit

#### `/api/coins/stats/route.ts` - FIXED

**Original Violations:**
1. Business logic embedded (caching, LRU eviction, TTL management)
2. Direct Zora SDK access
3. Data transformation logic in route

**Fix Applied:**
- Created `lib/services/coin-stats-service.ts` with all caching/SDK/transform logic
- Route now only validates input and delegates to service

---

#### `/api/miniapp/webhook/route.ts` - INTENTIONALLY UNCHANGED

**Original Violations:**
1. Data persistence directly in route (in-memory Map)
2. Functions exported from route file
3. Event handling business logic

**Decision:** Left as-is per user request. Will be addressed when persistent storage is needed.

---

### 2. UI Components Audit - PASS (No Changes Needed)

All UI components correctly follow the architecture rules.

---

### 3. lib/ Structure - FIXED

**Original Issues:**
- `lib/zora.ts` mixed business logic + SDK wrapper
- `lib/pinata.ts` mixed API calls + retry logic
- No layer separation

**Fixes Applied:**
- Split `lib/zora.ts` into:
  - `lib/services/coin-generator.ts` (business logic)
  - `lib/sdk/zora.ts` (SDK wrapper)
- Split `lib/pinata.ts` into:
  - `lib/repositories/ipfs.ts` (data access)
  - `lib/utils/with-retry.ts` (utility)
- Original files now re-export for backwards compatibility

---

## Debugging Benefits

The new architecture provides:

| Layer | Debug Location |
|-------|----------------|
| UI error | Check component state |
| Service error | Check `lib/services/` |
| API error | Check route (now just validation) |
| External API | Check `lib/sdk/` or `lib/repositories/` |

Each layer can be tested and debugged independently.

---

## Conclusion

Architecture refactoring complete. The codebase now follows proper layer separation:

```
UI Components
  ↓
API Routes (transport only)
  ↓
Services (business logic)
  ↓
Repositories + SDK wrappers (data access)
  ↓
External APIs
```

All existing imports (`@/lib/zora`, `@/lib/pinata`) remain backwards compatible.
