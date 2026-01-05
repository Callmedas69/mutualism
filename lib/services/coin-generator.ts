import type { CoinMetadata } from "@/types/tokenize";

// Graph type to symbol suffix mapping
const GRAPH_TYPE_SUFFIXES: Record<string, string> = {
  mutuals: "MUT",
  attention: "ATT",
  influence: "INF",
};

/**
 * Parse graph type string to normalized key
 */
function parseGraphType(graphType: string): "mutuals" | "attention" | "influence" {
  const lower = graphType.toLowerCase();
  if (lower.includes("attention")) return "attention";
  if (lower.includes("influence")) return "influence";
  return "mutuals";
}

/**
 * Generate coin name: username + graph type
 * Example: "0xd Mutuals", "dwr Attention", "vitalik Influence"
 */
export function generateCoinName(username: string, graphType: string): string {
  const type = parseGraphType(graphType);
  const suffix = type === "attention" ? "Attention"
    : type === "influence" ? "Influence"
    : "Mutuals";

  return `${username} ${suffix}`;
}

/**
 * Generate token symbol from username + graph type
 * Example: "0xd" + "mutuals" = "0XDMUT"
 * Zora symbols max 10 chars
 */
export function generateSymbol(username: string, graphType: string): string {
  const typeKey = parseGraphType(graphType);
  const suffix = GRAPH_TYPE_SUFFIXES[typeKey];
  const base = username.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const maxBase = 10 - suffix.length;
  return base.slice(0, Math.max(3, maxBase)) + suffix;
}

/**
 * Generate metadata object for a graph coin
 */
export function generateMetadata(
  username: string,
  fid: number,
  graphType: string,
  nodeCount: number,
  imageUri: string
): CoinMetadata {
  return {
    name: `Mutual Graph of @${username}`,
    description: `A snapshot of Farcaster social graph via Quotient, showing how people are connected across the network.`,
    image: imageUri,
    properties: {
      category: "social",
      fid,
      graphType,
      nodeCount,
      generatedAt: new Date().toISOString().slice(0, 10),
      source: "Quotient API",
    },
  };
}

/**
 * Generate share text for social media
 */
export function getShareText(username: string, coinUrl: string): string {
  return `Just tokenized my Farcaster social graph! Check out my connections:\n\n${coinUrl}`;
}
