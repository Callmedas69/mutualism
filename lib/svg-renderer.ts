// SVG Renderer for Graph Export
// This will be reused for NFT mint preview

export interface SVGNode {
  id: string;
  username: string;
  x: number;
  y: number;
  score: number;
  isCenter: boolean;
  color: string;
}

export interface SVGLink {
  source: SVGNode;
  target: SVGNode;
}

export interface SVGOptions {
  width?: number;
  height?: number;
  showLabels?: boolean;
  backgroundColor?: string;
  edgeColor?: string;
  edgeOpacity?: number;
}

// Calculate node radius based on score (matches ConnectionGraph logic)
function getNodeRadius(node: SVGNode, maxScore: number, nodeCount: number): number {
  if (node.isCenter) return 24;

  // Score-based sizing: smaller range for many nodes
  const minSize = nodeCount > 50 ? 8 : 10;
  const maxSize = nodeCount > 50 ? 16 : 20;
  const ratio = node.score / maxScore;

  return minSize + (maxSize - minSize) * ratio;
}

export function generateGraphSVG(
  nodes: SVGNode[],
  links: SVGLink[],
  options?: SVGOptions
): string {
  const width = options?.width ?? 1000;
  const height = options?.height ?? 1000;
  const backgroundColor = options?.backgroundColor ?? "#0a0a0a";
  const edgeColor = options?.edgeColor ?? "#6A3CFF";
  const edgeOpacity = options?.edgeOpacity ?? 0.3;
  const showLabels = options?.showLabels ?? true;

  // Calculate max score for size scaling
  const maxScore = Math.max(...nodes.map((n) => n.score), 1);
  const nodeCount = nodes.length;

  // Normalize positions to fit within viewBox
  const { normalizedNodes, normalizedLinks } = normalizePositions(
    nodes,
    links,
    width,
    height
  );

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;

  // Background
  svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}"/>`;

  // Edges
  svg += `<g opacity="${edgeOpacity}">`;
  for (const link of normalizedLinks) {
    svg += `<line x1="${link.source.x.toFixed(1)}" y1="${link.source.y.toFixed(1)}" x2="${link.target.x.toFixed(1)}" y2="${link.target.y.toFixed(1)}" stroke="${edgeColor}" stroke-width="1"/>`;
  }
  svg += `</g>`;

  // Nodes (score-based sizing)
  for (const node of normalizedNodes) {
    const r = getNodeRadius(node, maxScore, nodeCount);
    svg += `<circle cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${r.toFixed(1)}" fill="${node.color}"/>`;

    // Border for center node
    if (node.isCenter) {
      svg += `<circle cx="${node.x.toFixed(1)}" cy="${node.y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="#1d4ed8" stroke-width="3"/>`;
    }
  }

  // Labels
  if (showLabels) {
    svg += `<g font-family="Inter, system-ui, sans-serif" font-size="10">`;
    for (const node of normalizedNodes) {
      const r = getNodeRadius(node, maxScore, nodeCount);
      // Label background
      const label = `@${node.username}`;
      const textWidth = label.length * 5; // Approximate width
      svg += `<rect x="${(node.x - textWidth / 2 - 2).toFixed(1)}" y="${(node.y + r + 2).toFixed(1)}" width="${textWidth + 4}" height="14" fill="rgba(255,255,255,0.85)" rx="2"/>`;
      // Label text
      svg += `<text x="${node.x.toFixed(1)}" y="${(node.y + r + 12).toFixed(1)}" text-anchor="middle" fill="${node.isCenter ? "#3b82f6" : "#52525b"}">${label}</text>`;
    }
    svg += `</g>`;
  }

  svg += `</svg>`;
  return svg;
}

function normalizePositions(
  nodes: SVGNode[],
  links: SVGLink[],
  width: number,
  height: number
): { normalizedNodes: SVGNode[]; normalizedLinks: SVGLink[] } {
  if (nodes.length === 0) {
    return { normalizedNodes: [], normalizedLinks: [] };
  }

  // Find bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y);
  }

  // Add padding
  const padding = 60;
  const graphWidth = maxX - minX || 1;
  const graphHeight = maxY - minY || 1;

  const scaleX = (width - padding * 2) / graphWidth;
  const scaleY = (height - padding * 2) / graphHeight;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (width - graphWidth * scale) / 2 - minX * scale;
  const offsetY = (height - graphHeight * scale) / 2 - minY * scale;

  // Create normalized nodes
  const nodeMap = new Map<string, SVGNode>();
  const normalizedNodes = nodes.map((node) => {
    const normalized = {
      ...node,
      x: node.x * scale + offsetX,
      y: node.y * scale + offsetY,
    };
    nodeMap.set(node.id, normalized);
    return normalized;
  });

  // Create normalized links
  const normalizedLinks = links.map((link) => ({
    source: nodeMap.get(link.source.id) || link.source,
    target: nodeMap.get(link.target.id) || link.target,
  }));

  return { normalizedNodes, normalizedLinks };
}
