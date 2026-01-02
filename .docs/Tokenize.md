# Node Graph Tokenization Plan (Zora Coins)

This document describes how to tokenize a Farcaster Node Graph (generated via Quotient API) as a **social token** using **Zora Coins SDK on Base**.

---

## 1. Goal

Transform a dynamically generated **social graph snapshot** into a **tokenized, tradeable social coin** — each user creates their own unique token that represents their social identity at a point in time.

The output is an **ERC-20 Social Token** via Zora Coins with built-in trading via Uniswap pools.

---

## 2. What Is Being Tokenized

| Field | Value |
|-------|-------|
| Input | Farcaster FID (root user) |
| Source | Quotient API (mutuals / attention / influence) |
| Output | Force-directed Node Graph |
| Format | High-resolution PNG snapshot (1000x1000, 2x scale) |
| Meaning | Time-based snapshot of social connections |

This is an **identity + time artifact**, not generative art.

---

## 3. Why Zora Coins (ERC-20)

**Decision:** Use `@zoralabs/coins-sdk` instead of ERC-1155 Editions.

### Benefits

- Social-first token model (like tokenized posts)
- Built-in trading via Uniswap pool
- Base-native
- Simple SDK with wagmi integration (`createCoinCall`)
- Platform referrer rewards (ongoing revenue)
- Creator earnings from trades

### Trade-offs

- ERC-20 (fungible) vs ERC-1155 (semi-fungible)
- Each user deploys own contract (not shared collection)

---

## 4. Roles & Revenue Model

### Roles

| Role | Who | Description |
|------|-----|-------------|
| **Creator** | Each User | Owns their coin, earns from trades |
| **Platform Referrer** | Platform Owner | Earns ~1% referral on all trades |

### Revenue Streams (Platform)

| Source | Amount | When |
|--------|--------|------|
| Tokenization Fee | 0.002 ETH | Upfront, per tokenization |
| Platform Referrer | ~1% of trades | Ongoing, forever |

### Per-User Token

Each tokenization creates:
- **Unique ERC-20 contract** on Base
- **Dynamic name**: `Mutual Graph of @{username}`
- **Dynamic symbol**: Generated from username (e.g., `DWR`, `VITALIK`)
- **Unique IPFS metadata**: Snapshot of their graph at that moment
- **Creator = User's wallet** (`payoutRecipient`)
- **Referrer = Platform wallet** (`platformReferrer`)

---

## 5. High-Level Flow

```
Generate Graph → Export PNG Blob → Upload to IPFS → Create Zora Coin → Share Link
```

### Technical Flow

```
1. User clicks "Tokenize"
2. Pay 0.002 ETH tokenization fee → Platform wallet
3. Capture graph canvas as Blob
4. Upload PNG to IPFS via Pinata (server-side)
5. Generate metadata JSON, upload to IPFS
6. Call Zora createCoin with metadata URI
7. Return coin address + Zora URL
```

---

## 6. PNG Export (Current Implementation)

The graph is rendered using `react-force-graph-2d` and exported via canvas:

- Resolution: 1000 × 1000
- Scale: 2× (retina / crisp)
- Includes:
  - Title & legend
  - Graph type (Mutuals / Attention / Influence)
  - Visual encoding of scores

**Modification needed:** Add `getGraphBlob()` function that returns `Blob` instead of downloading.

---

## 7. IPFS Upload

### Service: Pinata

Zora Coins SDK does **not** provide IPFS upload. Use Pinata (`pinata-web3`).

### Upload Flow

```
Client                         Server (API Route)
  │                                  │
  │  POST /api/tokenize              │
  │  Body: FormData (PNG blob)       │
  │ ────────────────────────────────>│
  │                                  │  Upload to Pinata
  │                                  │  (using PINATA_JWT)
  │  { ipfsUri: "ipfs://..." }       │
  │ <────────────────────────────────│
```

**Why server-side:** Keeps `PINATA_JWT` secure (never exposed to client).

### Environment Variables

```env
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=your_gateway.mypinata.cloud
```

---

## 8. Metadata Schema (EIP-7572)

```json
{
  "name": "Mutual Graph of @username",
  "description": "Farcaster social graph snapshot via Quotient",
  "image": "ipfs://bafkreixxxx...",
  "properties": {
    "category": "social",
    "fid": 1234,
    "graphType": "Mutuals",
    "nodeCount": 47,
    "generatedAt": "2025-01-29",
    "source": "Quotient API"
  }
}
```

---

## 9. Zora Coins SDK Integration

### Package

```bash
npm install @zoralabs/coins-sdk
```

### Code (wagmi integration)

```typescript
import { createCoinCall } from "@zoralabs/coins-sdk";
import { useSimulateContract, useWriteContract } from "wagmi";
import { base } from "viem/chains";

const coinParams = {
  name: `Mutual Graph of @${username}`,
  symbol: generateSymbol(username),  // e.g., "DWR"
  uri: metadataIpfsUri,              // "ipfs://bafkrei..."
  payoutRecipient: userWalletAddress,
  platformReferrer: PLATFORM_WALLET,
  chainId: base.id,
};

const contractCallParams = await createCoinCall(coinParams);

// In component
const { data: writeConfig } = useSimulateContract({
  ...contractCallParams,
});

const { writeContract } = useWriteContract();
```

### Result

```typescript
{
  hash: "0x...",           // Transaction hash
  address: "0x...",        // New coin contract address
  deployment: { ... }      // Deployment details
}
```

### Coin URL

```
https://zora.co/coin/base:{coinAddress}
```

---

## 10. UX Flow

```
┌─────────────────────────────────────────────┐
│  Dashboard with Graph                       │
│                                             │
│  [Export PNG]  [Tokenize]  ← New button     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Tokenize Modal - Preview                   │
│  ┌──────────┐                               │
│  │  Graph   │  Name: Mutual Graph of @dwr   │
│  │  Preview │  Symbol: DWR                  │
│  └──────────┘  Fee: 0.002 ETH               │
│                                             │
│  [Cancel]              [Tokenize →]         │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 1: Pay Fee                            │
│  Wallet prompt: Send 0.002 ETH              │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 2: Uploading                          │
│  ● Capturing graph...                       │
│  ● Uploading to IPFS...                     │
│  ● Creating metadata...                     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Step 3: Create Coin                        │
│  Wallet prompt: Confirm Zora transaction    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│  Success!                                   │
│                                             │
│  Your coin is live on Zora                  │
│  zora.co/coin/base:0x1234...                │
│                                             │
│  [View on Zora]  [Copy Link]  [Close]       │
└─────────────────────────────────────────────┘
```

---

## 11. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `lib/pinata.ts` | IPFS upload helper |
| `lib/zora.ts` | Zora SDK wrapper |
| `app/api/tokenize/route.ts` | Server-side Pinata upload |
| `components/dashboard/TokenizeButton.tsx` | UI trigger |
| `components/dashboard/TokenizeModal.tsx` | Multi-step flow |
| `types/tokenize.ts` | TypeScript interfaces |

### Modify

| File | Change |
|------|--------|
| `components/dashboard/ConnectionGraph.tsx` | Add `getGraphBlob()` function |
| `package.json` | Add `@zoralabs/coins-sdk`, `pinata-web3` |

---

## 12. Environment Variables

```env
# Existing
NEXT_PUBLIC_PROJECT_ID=...
NEXT_PUBLIC_ALCHEMY_API_KEY=...
QUOTIENT_API_KEY=...

# New (add these)
PINATA_JWT=your_pinata_jwt
PINATA_GATEWAY=your_gateway.mypinata.cloud
NEXT_PUBLIC_PLATFORM_WALLET=0x...      # Fee recipient
NEXT_PUBLIC_PLATFORM_REFERRER=0x...    # Zora referrer rewards
```

---

## 13. Ethics & Safety Notes

### Safe Because

- FIDs are public
- No wallet addresses stored in metadata
- No private edges
- Neutral presentation
- User owns their token (not platform)

### Avoid

- Aggressive ranking
- Value judgments
- Selling personal data
- Misleading users about token value

---

## 14. Future Extensions (Out of Scope for v1)

- SVG export option
- Multiple graph types in one token
- Time-series graph collections
- Comparison graphs (You vs X)
- Batch tokenization discounts
- Custom collect pricing

---

## 15. Summary

| Aspect | Decision |
|--------|----------|
| Token Type | Zora Coins (ERC-20) |
| SDK | `@zoralabs/coins-sdk` |
| IPFS | Pinata (server-side) |
| Creator | User (earns from trades) |
| Platform | Referrer (earns ~1% + 0.002 ETH fee) |
| Network | Base |

This approach is simple, scalable, and aligned with Farcaster + Base culture.
