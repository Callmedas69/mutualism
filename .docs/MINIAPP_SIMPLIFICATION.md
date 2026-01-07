# Mini App Simplification Plan

> **Status**: ✅ COMPLETE
> **Date**: 2026-01-07
> **Completed**: 2026-01-07

## Goal

Simplify Mini App to focus on virality:
- Show only Mutuals and Influence graphs
- Add count badge
- Hide Home, Gallery, Attention tab
- Single-purpose: See graph → Share

---

## Psychology Behind Decision

| Tab | Emotion | Share Driver | Keep? |
|-----|---------|--------------|-------|
| **Mutuals** | Belonging | Safe, identity | ✅ Yes |
| **Influence** | Status, ego | Flex, viral | ✅ Yes |
| **Attention** | Taste | Curation | ❌ No (least shareable) |

**Mutuals** = "These are my people" (safe share)
**Influence** = "These people care about ME" (flex share)

---

## Current State

```
Mini App Navigation:
├── Home (/)
├── Graph (/graph)
│   ├── Mutuals tab
│   ├── Attention tab
│   └── Influence tab
└── Gallery (/gallery)
```

## Target State

```
Mini App:
└── Graph (/graph) - ONLY destination
    ├── Mutuals tab (default)
    └── Influence tab
    + Count badge ({count} Mutuals/Influence)
    + Share button (prominent)
```

---

## Target UX

```
┌─────────────────────────────┐
│  [Mutuals] [Influence]      │  ← Two tabs only
│                             │
│  47 Mutuals                 │  ← Dynamic badge
│                             │
│      [GRAPH]                │  ← Tap nodes for profile
│                             │
│      [SHARE]                │  ← Primary action
└─────────────────────────────┘
```

---

## Files to Modify

### 1. `components/MiniAppNavbar.tsx`
**Change:** Hide entire navbar in Mini App (only one destination)

### 2. `components/graph/ConnectionTabs.tsx`
**Change:** Filter out Attention tab when `isMiniApp === true`

```typescript
const visibleTabs = isMiniApp
  ? tabs.filter(t => t.key !== "attention")
  : tabs;
```

### 3. `app/page.tsx` (Home)
**Change:** Redirect to /graph when `isMiniApp === true`

```typescript
useEffect(() => {
  if (isMiniApp) {
    router.replace("/graph");
  }
}, [isMiniApp, router]);
```

### 4. `app/gallery/page.tsx`
**Change:** Redirect to /graph when `isMiniApp === true`

### 5. `components/graph/ConnectionGraph.tsx` or `PageWrapper.tsx`
**Change:** Add count badge above graph

```tsx
<div className="badge">
  {nodeCount} {activeTab === "mutuals" ? "Mutuals" : "Influence"}
</div>
```

---

## Implementation Order

1. **Hide MiniAppNavbar** - Single page, no nav needed
2. **Redirect Home → /graph** - Auto-navigate in mini app
3. **Redirect Gallery → /graph** - Auto-navigate in mini app
4. **Filter Attention tab** - Show only Mutuals/Influence
5. **Add count badge** - Display above graph
6. **Verify Share button** - Ensure prominent placement

---

## Architecture Compliance (CLAUDE.md)

| Rule | Compliance |
|------|------------|
| UI only displays | ✅ No business logic changes |
| No direct DB/chain calls | ✅ Using existing hooks |
| Conditional rendering | ✅ Based on isMiniApp context |
| Responsive design | ✅ Mobile-first mini app |

---

## UX Flow (After)

```
User opens Mini App
    ↓
Auto-lands on /graph (Mutuals default)
    ↓
Sees: [Mutuals] [Influence] tabs
      47 Mutuals (badge)
      [GRAPH]
      [SHARE]
    ↓
Tap node → See profile
Tap Share → Upload + Compose cast
```

---

## What's Preserved (Web Mode)

Web mode keeps all features:
- Home page with hero
- Gallery page
- All three tabs (Mutuals, Attention, Influence)
- Full navigation

**Changes are Mini App specific only.**

---

## Testing Checklist

- [x] Mini App opens directly to graph (Home/Gallery redirect to /graph)
- [x] No Home/Gallery navigation visible (MiniAppNavbar hidden)
- [x] Only Mutuals and Influence tabs shown (Attention filtered)
- [x] Count badge displays correct number
- [x] Badge updates when switching tabs
- [x] Share button works (already implemented)
- [x] Tap node shows profile popup (already implemented)
- [ ] Web mode unchanged (still has all features) - Verify manually

## Files Modified

| File | Change |
|------|--------|
| `components/MiniAppNavbar.tsx` | Returns null (hidden entirely) |
| `app/page.tsx` | Redirects to /graph when isMiniApp |
| `app/gallery/page.tsx` | Redirects to /graph when isMiniApp |
| `components/graph/ConnectionTabs.tsx` | Filters Attention tab + adds count badge |
