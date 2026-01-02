# Gallery Enhancement: On-Chain Registry + Live Stats

## Overview
Replace localStorage with a simple on-chain registry contract on Base, and display live coin performance metrics from Zora API.

---

## Architecture

```
User creates coin → TokenizeModal → Zora SDK creates coin
                                  → Registry contract stores coinAddress

Gallery loads → Query Registry for user's coins
             → Fetch live stats from Zora API
             → Display: market cap, volume, holders, % change
```

---

## Part 1: Smart Contract

**File: `contracts/CoinRegistry.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract CoinRegistry {
    event CoinRegistered(address indexed creator, address indexed coin, uint256 timestamp);

    mapping(address => address[]) private _creatorCoins;

    function registerCoin(address coin) external {
        require(coin != address(0), "Invalid coin address");
        _creatorCoins[msg.sender].push(coin);
        emit CoinRegistered(msg.sender, coin, block.timestamp);
    }

    function getCoinsByCreator(address creator) external view returns (address[] memory) {
        return _creatorCoins[creator];
    }

    function getCoinCount(address creator) external view returns (uint256) {
        return _creatorCoins[creator].length;
    }
}
```

**Why minimal:**
- No admin functions (no ownership)
- No upgradeability (simple enough to redeploy)
- No reentrancy risk (no ETH handling)
- ~$0.01 per registration on Base

---

## Part 2: API Endpoint

**File: `app/api/coins/stats/route.ts`**

```typescript
// POST /api/coins/stats
// Body: { addresses: string[] }
// Returns: CoinStats[]

import { getCoins } from "@zoralabs/coins-sdk";

// In-memory cache (60s TTL)
const cache = new Map<string, { data: any; timestamp: number }>();

export async function POST(request: NextRequest) {
  const { addresses } = await request.json();

  // Check cache first
  // Batch fetch from Zora via getCoins()
  // Return: marketCap, volume24h, uniqueHolders, marketCapDelta24h
}
```

---

## Part 3: Frontend Changes

### 3.1 Registry Configuration
**File: `lib/registry.ts`**

```typescript
export const REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as Address;
export const REGISTRY_ABI = [...] as const;
```

### 3.2 Custom Hooks
**File: `hooks/useCreatorCoins.ts`**
- Uses `useReadContract` to query registry
- Returns coin addresses for connected wallet

**File: `hooks/useCoinStats.ts`**
- Uses React Query to fetch from `/api/coins/stats`
- 30s stale time, 60s refetch interval

### 3.3 TokenizeModal Update
**File: `components/dashboard/TokenizeModal.tsx`**

After successful coin creation (success step):
```typescript
// Fire-and-forget registry call
registerOnChain({
  address: REGISTRY_ADDRESS,
  abi: REGISTRY_ABI,
  functionName: "registerCoin",
  args: [coinAddress],
});
```

### 3.4 Gallery Page Redesign
**File: `app/gallery/page.tsx`**

1. Query registry via `useCreatorCoins()`
2. Fetch stats via `useCoinStats(addresses)`
3. Display enhanced cards with performance metrics

**Card Layout:**
```
┌─────────────────────────────────────┐
│ @dwr's Inner Circle      $DWRFAM   │
│ Mutuals • 47 connections           │
├─────────────────────────────────────┤
│ Market Cap    │ 24h Volume         │
│ Ξ 0.42        │ Ξ 0.08             │
├─────────────────────────────────────┤
│ Holders       │ 24h Change         │
│ 23            │ +12.5% ↑           │
├─────────────────────────────────────┤
│ [View on Zora]                     │
└─────────────────────────────────────┘
```

---

## Part 4: Types

**File: `types/tokenize.ts`**

```typescript
export interface CoinStats {
  address: string;
  name: string;
  symbol: string;
  marketCap: string;
  volume24h: string;
  uniqueHolders: number;
  priceChange24h: string;
}
```

---

## Implementation Sequence

| # | Task | File |
|---|------|------|
| 1 | Deploy CoinRegistry contract | `contracts/CoinRegistry.sol` |
| 2 | Add registry address to env | `.env.local` |
| 3 | Create registry lib | `lib/registry.ts` |
| 4 | Create stats API endpoint | `app/api/coins/stats/route.ts` |
| 5 | Create useCreatorCoins hook | `hooks/useCreatorCoins.ts` |
| 6 | Create useCoinStats hook | `hooks/useCoinStats.ts` |
| 7 | Update TokenizeModal | `components/dashboard/TokenizeModal.tsx` |
| 8 | Redesign Gallery page | `app/gallery/page.tsx` |
| 9 | Update types | `types/tokenize.ts` |
| 10 | Remove localStorage usage | `lib/storage.ts` (optional: keep for migration) |

---

## Migration Strategy

1. **New coins**: Automatically registered on-chain
2. **Old coins (localStorage)**: Optional "Sync to Registry" button
3. **Fallback**: Gallery checks both registry AND localStorage during transition

---

## Environment Variables

```env
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...  # Deployed contract address
```

---

## Testing Checklist

- [ ] Contract deploys on Base
- [ ] registerCoin() works from TokenizeModal
- [ ] getCoinsByCreator() returns correct addresses
- [ ] API caches Zora responses (60s)
- [ ] Gallery shows live stats
- [ ] Empty state when no coins
- [ ] Loading states work correctly
- [ ] Works across devices (no localStorage dependency)
