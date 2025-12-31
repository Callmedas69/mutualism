// Brand
export const BRAND = {
  name: "MUTUALISM",
  description: "Quotient Mutual - Base Network dApp",
  colors: {
    farcaster: "#6A3CFF",
  },
} as const;

// API Endpoints
export const API = {
  quotient: "https://api.quotient.social",
  optimismRpc: "https://mainnet.optimism.io",
} as const;

// RPC URLs
export const RPC = {
  base: `https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
} as const;

// External URLs
export const URLS = {
  warpcast: "https://warpcast.com",
} as const;
