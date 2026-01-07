import type { CoinMetadata, SnapshotMetadata, SnapshotView, TimeWindow } from "@/types/tokenize";

// ============================================
// Snapshot Functions (v1 - per PINATA_RESTRUCTURING.md)
// ============================================

/**
 * Map graph type string to SnapshotView
 */
export function mapGraphTypeToView(graphType: string): SnapshotView {
  const lower = graphType.toLowerCase();
  if (lower.includes("attention")) return "attention_circle";
  if (lower.includes("influence")) return "influence_circle";
  return "mutual_circle";
}

/**
 * Generate folder name for Pinata snapshot
 * Format: {view}_fid{FID}_{timeWindow}_{ISO-datetime}
 * Example: mutual-circle_fid22420_last30d_2026-01-05T18-42
 */
export function generateFolderName(
  view: SnapshotView,
  fid: number,
  timeWindow: TimeWindow
): string {
  const viewSlug = view.replace(/_/g, "-"); // mutual_circle -> mutual-circle
  const timeSlug = timeWindow.replace(/_/g, ""); // last_30d -> last30d
  const now = new Date();
  const isoDate = now.toISOString().slice(0, 16).replace(":", "-"); // 2026-01-05T18-42
  return `${viewSlug}_fid${fid}_${timeSlug}_${isoDate}`;
}

/**
 * Generate v1 compliant snapshot metadata
 * Rules:
 * - A snapshot is immutable
 * - The PNG is the truth
 * - No analytics/metrics (nodeCount, scores, rankings FORBIDDEN)
 */
export function generateSnapshotMetadata(
  username: string,
  fid: number,
  view: SnapshotView,
  timeWindow: TimeWindow,
  imageCid: string
): SnapshotMetadata {
  const viewLabel = view === "mutual_circle" ? "Mutual Circle"
    : view === "attention_circle" ? "Attention Circle"
    : "Influence Circle";

  return {
    name: `${viewLabel} of @${username}`,
    description: `A snapshot of real interactions on Farcaster, showing the people @${username} actually interacts with.`,
    image: `ipfs://${imageCid}`,
    properties: {
      category: "mutualism",
      fid,
      view,
      timeWindow,
      generatedAt: new Date().toISOString(),
      graphVersion: "v1",
      source: "Quotient API",
    },
  };
}

/**
 * Generate filename for share image (no folder, image only)
 * Format: {view}_fid{FID}_{timeWindow}_{ISO-datetime}.png
 */
export function generateShareFilename(
  view: SnapshotView,
  fid: number,
  timeWindow: TimeWindow
): string {
  return `${generateFolderName(view, fid, timeWindow)}.png`;
}

// ============================================
// Legacy Functions (for backward compatibility)
// ============================================

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
 * @deprecated Use generateSnapshotMetadata instead
 * Generate metadata object for a graph coin (legacy, nodeCount removed)
 */
export function generateMetadata(
  username: string,
  fid: number,
  graphType: string,
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
