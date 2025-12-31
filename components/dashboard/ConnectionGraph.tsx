"use client";

import React, { useRef, useCallback, useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { forceCollide } from "d3-force";
import gsap from "gsap";
import type { MutualUser, ConnectionUser } from "@/types/quotient";
import type { TokenizeGraphData } from "@/types/tokenize";
import { URLS } from "@/lib/constants";
import { LRUCache } from "@/lib/utils/lru-cache";
import NodeInfoCard from "./NodeInfoCard";
import ExportButton from "./ExportButton";
import TokenizeButton from "./TokenizeButton";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface ConnectionGraphProps {
  connections: (MutualUser | ConnectionUser)[];
  centerUser: {
    fid: number;
    username: string;
    pfp_url: string | null;
  };
  type: "mutuals" | "attention" | "influence";
}

interface GraphNode {
  id: string;
  fid: number;
  username: string;
  pfp_url: string | null;
  score: number;
  isCenter: boolean;
  color: string;
  x?: number;
  y?: number;
}

interface GraphLink {
  source: string;
  target: string;
}

// LRU cache for loaded images (max 200 entries to prevent memory bloat)
const imageCache = new LRUCache<string, HTMLImageElement>(200);

// LRU cache for pre-rendered circular avatar canvases (max 400 entries)
// Higher limit because same image may have multiple size variants
const avatarCanvasCache = new LRUCache<string, HTMLCanvasElement>(400);

function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Pre-render clipped circular avatar to offscreen canvas (called once per avatar)
// Uses 4x resolution for crisp export quality
function getAvatarCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const key = `${img.src}-${size}`;
  const cached = avatarCanvasCache.get(key);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  const scale = 4; // High-res for export quality
  const diameter = size * 2 * scale;
  canvas.width = diameter;
  canvas.height = diameter;
  const ctx = canvas.getContext("2d")!;

  // Draw circular clip and image at high resolution
  ctx.beginPath();
  ctx.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, 0, 0, diameter, diameter);

  avatarCanvasCache.set(key, canvas);
  return canvas;
}

function getScoreColor(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio > 0.7) return "#22c55e"; // green
  if (ratio > 0.4) return "#eab308"; // yellow
  return "#71717a"; // gray
}

function isMutualUser(user: MutualUser | ConnectionUser): user is MutualUser {
  return "combined_score" in user;
}

// Stable link color function (avoid inline recreations)
const LINK_COLOR = "rgba(113, 113, 122, 0.2)";
const getLinkColor = () => LINK_COLOR;

// LOD threshold - hide labels when zoomed out below this scale
const LOD_LABEL_THRESHOLD = 1.2;

// Shared render options interface
interface RenderToCanvasOptions {
  ctx: CanvasRenderingContext2D;
  exportSize: number;
  type: "mutuals" | "attention" | "influence";
  graphData: { nodes: GraphNode[]; links: GraphLink[] };
  loadedImages: Map<string, HTMLImageElement>;
  centerUsername: string;
}

// Shared high-resolution graph rendering function (DRY)
function renderGraphToCanvas(options: RenderToCanvasOptions): void {
  const { ctx, exportSize, type, graphData, loadedImages, centerUsername } = options;

  // Layout constants
  const footerHeight = 200; // Increased for more padding
  const graphAreaTop = 0;
  const graphAreaBottom = exportSize - footerHeight;
  const uiScale = exportSize / 1200;

  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Pastel gradient background for graph area
  const gradient = ctx.createLinearGradient(0, 0, exportSize, graphAreaBottom);
  gradient.addColorStop(0, "#E8F4F8");
  gradient.addColorStop(1, "#F5E6FF");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, exportSize, graphAreaBottom);

  // Calculate graph bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const node of graphData.nodes) {
    if (node.x !== undefined && node.y !== undefined) {
      const size = node.isCenter ? 28 : 20;
      minX = Math.min(minX, node.x - size);
      maxX = Math.max(maxX, node.x + size);
      minY = Math.min(minY, node.y - size);
      maxY = Math.max(maxY, node.y + size);
    }
  }

  const padding = 60;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;
  const graphCenterX = (minX + maxX) / 2;
  const graphCenterY = (minY + maxY) / 2;

  // Calculate transform to fit graph into export area
  const graphAreaSize = graphAreaBottom - 40; // 40px padding
  const scale = graphAreaSize / Math.max(graphWidth, graphHeight);
  const offsetX = exportSize / 2 - graphCenterX * scale;
  const offsetY = graphAreaBottom / 2 - graphCenterY * scale;

  // Helper to transform coordinates
  const tx = (x: number) => x * scale + offsetX;
  const ty = (y: number) => y * scale + offsetY;

  // Draw all links first (behind nodes)
  ctx.strokeStyle = "rgba(156, 163, 175, 0.4)";
  ctx.lineWidth = 1.5 * uiScale;
  for (const link of graphData.links) {
    const source = link.source as any;
    const target = link.target as any;
    if (source.x !== undefined && target.x !== undefined) {
      ctx.beginPath();
      ctx.moveTo(tx(source.x), ty(source.y));
      ctx.lineTo(tx(target.x), ty(target.y));
      ctx.stroke();
    }
  }

  // Draw all nodes with high-res avatars (NO username labels)
  for (const node of graphData.nodes) {
    if (node.x === undefined || node.y === undefined) continue;

    const baseSize = node.isCenter ? 28 : 20;
    const nodeSize = baseSize * scale;
    const x = tx(node.x);
    const y = ty(node.y);

    const img = node.pfp_url ? loadedImages.get(node.pfp_url) : null;

    if (img) {
      // Draw circular avatar directly from source image (high quality)
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x - nodeSize, y - nodeSize, nodeSize * 2, nodeSize * 2);
      ctx.restore();

      // Draw border
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.strokeStyle = node.isCenter ? "#3b82f6" : (node.color || "#71717a");
      ctx.lineWidth = (node.isCenter ? 4 : 2.5) * uiScale;
      ctx.stroke();
    } else {
      // Fallback: colored circle with initial
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = node.color || "#71717a";
      ctx.fill();

      ctx.font = `bold ${nodeSize * 0.9}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(node.username.charAt(0).toUpperCase(), x, y);

      if (node.isCenter) {
        ctx.beginPath();
        ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 4 * uiScale;
        ctx.stroke();
      }
    }
    // No username labels - cleaner graph
  }

  // ========== FOOTER PANEL ==========
  const footerY = graphAreaBottom;

  // Dark footer background
  ctx.fillStyle = "#18181b"; // zinc-900
  ctx.fillRect(0, footerY, exportSize, footerHeight);

  // Divider line
  ctx.strokeStyle = "#3f3f46"; // zinc-700
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(exportSize, footerY);
  ctx.stroke();

  const margin = 32 * uiScale;
  const columnDivider = exportSize * 0.28; // Narrower branding column

  // Helper for letter-spaced text
  const drawSpacedText = (text: string, x: number, y: number, spacing: number) => {
    ctx.textAlign = "left";
    let currentX = x;
    for (const char of text) {
      ctx.fillText(char, currentX, y);
      currentX += ctx.measureText(char).width + spacing;
    }
  };

  // ===== LEFT COLUMN: Branding =====
  const leftX = margin;
  let leftY = footerY + 45 * uiScale;

  // MUTUALISM brand with orange M (larger font)
  ctx.font = `bold ${Math.round(42 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "left";

  // Draw "M" in orange
  ctx.fillStyle = "#f25b28";
  ctx.fillText("M", leftX, leftY);
  const mWidth = ctx.measureText("M").width + 0.1 * uiScale;

  // Draw "UTUALISM" in white with tighter letter spacing
  ctx.fillStyle = "#ffffff";
  let currentX = leftX + mWidth;
  for (const char of "UTUALISM") {
    ctx.fillText(char, currentX, leftY);
    currentX += ctx.measureText(char).width + 0.1 * uiScale;
  }

  // Graph type + @username + count CONNECTIONS (combined on one line)
  leftY += 22 * uiScale;
  const tabLabel = type === "mutuals" ? "ALL MUTUALS" : type === "attention" ? "ATTENTION" : "INFLUENCE";
  const nodeCount = graphData.nodes.length - 1;
  ctx.font = `${Math.round(14 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#a1a1aa"; // zinc-400
  ctx.textAlign = "left";
  ctx.fillText(`${tabLabel} • @${centerUsername} • ${nodeCount} connections`, leftX, leftY);

  // Date
  leftY += 22 * uiScale; // Reduced spacing
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  ctx.font = `${Math.round(12 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#52525b"; // zinc-600
  ctx.fillText(dateStr, leftX, leftY);

  // ===== RIGHT COLUMN: Top Connections =====
  const rightX = columnDivider + 20 * uiScale;
  let rightY = footerY + 24 * uiScale; // Match left column

  // TOP CONNECTIONS header
  ctx.font = `500 ${Math.round(11 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#a1a1aa";
  drawSpacedText("TOP CONNECTIONS", rightX, rightY, 1.5 * uiScale);

  // Get top 28 connections (sorted by score, excluding center)
  const topConnections = graphData.nodes
    .filter(n => !n.isCenter)
    .sort((a, b) => b.score - a.score)
    .slice(0, 28);

  // Draw usernames in 7 columns × 4 rows = 28 users
  ctx.font = `${Math.round(9 * uiScale)}px "SF Mono", Monaco, monospace`;
  ctx.fillStyle = "#d4d4d8"; // zinc-300
  ctx.textAlign = "left";

  const availableWidth = exportSize - rightX - 20 * uiScale; // Full width minus margins
  const colWidth = availableWidth / 7; // Even distribution across 7 columns
  const lineHeight = 20 * uiScale;
  const rowsPerCol = 4; // 4 users per column
  const maxUsernameLength = 13; // Truncate long usernames

  topConnections.forEach((node, i) => {
    const colIndex = Math.floor(i / rowsPerCol);
    const rowIndex = i % rowsPerCol;
    const x = rightX + colIndex * colWidth;
    const y = rightY + 18 * uiScale + rowIndex * lineHeight;
    // Truncate long usernames with ellipsis
    let username = node.username;
    if (username.length > maxUsernameLength) {
      username = username.slice(0, maxUsernameLength - 1) + "…";
    }
    ctx.fillText(`@${username}`, x, y);
  });

  // Vertical divider between columns
  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(columnDivider, footerY + 16 * uiScale);
  ctx.lineTo(columnDivider, footerY + footerHeight - 16 * uiScale);
  ctx.stroke();
}

function ConnectionGraph({
  connections,
  centerUser,
  type,
}: ConnectionGraphProps) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialZoom = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Use ref for image lookups in callbacks (stable reference)
  // State triggers re-render when images are loaded
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });

  // Limit nodes based on count to prevent overcrowding
  const maxNodes = connections.length > 100 ? 50 : connections.length > 50 ? 75 : 100;

  useEffect(() => {
    const updateDimensions = () => {
      const container = document.getElementById("graph-container");
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.max(600, window.innerHeight - 250),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Preload images - uses ref for stable callback access
  useEffect(() => {
    const urlsToLoad: string[] = [];

    if (centerUser.pfp_url) {
      urlsToLoad.push(centerUser.pfp_url);
    }

    connections.slice(0, maxNodes).forEach((c) => {
      if (c.pfp_url) {
        urlsToLoad.push(c.pfp_url);
      }
    });

    const loadAllImages = async () => {
      const newImages = new Map<string, HTMLImageElement>();

      await Promise.all(
        urlsToLoad.map(async (url) => {
          try {
            const img = await loadImage(url);
            newImages.set(url, img);
          } catch {
            // Failed to load image, will show fallback
          }
        })
      );

      // Update ref (stable for callbacks) and trigger re-render
      loadedImagesRef.current = newImages;
      setImagesLoaded(true);
    };

    // Reset state for new data
    setImagesLoaded(false);
    loadAllImages();
  }, [connections, centerUser, maxNodes]);

  const graphData = useMemo(() => {
    const maxScore = Math.max(
      ...connections.map((c) =>
        isMutualUser(c) ? c.combined_score : c.score
      ),
      1
    );

    const nodes: GraphNode[] = [
      {
        id: `user-${centerUser.fid}`,
        fid: centerUser.fid,
        username: centerUser.username,
        pfp_url: centerUser.pfp_url,
        score: maxScore,
        isCenter: true,
        color: "#3b82f6",
      },
      ...connections.slice(0, maxNodes).map((c) => {
        const score = isMutualUser(c) ? c.combined_score : c.score;
        return {
          id: `user-${c.fid}`,
          fid: c.fid,
          username: c.username,
          pfp_url: c.pfp_url,
          score,
          isCenter: false,
          color: getScoreColor(score, maxScore),
        };
      }),
    ];

    const links: GraphLink[] = connections.slice(0, maxNodes).map((c) => ({
      source: `user-${centerUser.fid}`,
      target: `user-${c.fid}`,
    }));

    return { nodes, links };
  }, [connections, centerUser, maxNodes]);

  // GSAP smooth camera focus on node click + show info card
  const handleNodeClick = useCallback((node: any, event: MouseEvent) => {
    const graph = graphRef.current;
    const container = containerRef.current;

    // Calculate card position from mouse event
    if (container) {
      const rect = container.getBoundingClientRect();
      setCardPosition({
        x: event.clientX - rect.left + 20,
        y: event.clientY - rect.top - 20,
      });
    }

    if (!graph) {
      setSelectedNode(node);
      return;
    }

    // Get current camera state
    const currentZoom = graph.zoom() || 1;
    const targetZoom = 2.5;

    // Animate camera to node
    const camera = { zoom: currentZoom };

    gsap.to(camera, {
      duration: 0.5,
      zoom: targetZoom,
      ease: "power2.out",
      onUpdate: () => {
        graph.zoom(camera.zoom);
      },
      onComplete: () => {
        graph.centerAt(node.x, node.y);
        // Show info card after zoom animation
        setSelectedNode(node);
      },
    });
  }, []);

  // Close info card
  const handleCloseCard = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Open Warpcast profile
  const handleViewProfile = useCallback(() => {
    if (selectedNode) {
      window.open(`${URLS.warpcast}/${selectedNode.username}`, "_blank");
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Calculate max score for size scaling
  const maxScore = useMemo(() => {
    return Math.max(
      ...connections.map((c) =>
        isMutualUser(c) ? c.combined_score : c.score
      ),
      1
    );
  }, [connections]);

  // Calculate node size based on score (higher score = bigger node)
  const getNodeSize = useCallback((node: GraphNode) => {
    if (node.isCenter) return 28;

    // Score-based sizing: 12px (low) to 22px (high)
    const minSize = connections.length > 50 ? 10 : 12;
    const maxSize = connections.length > 50 ? 18 : 22;
    const ratio = node.score / maxScore;

    return minSize + (maxSize - minSize) * ratio;
  }, [connections.length, maxScore]);

  // Optimized node rendering with offscreen canvas cache and LOD
  // Uses ref for image lookup to prevent callback recreation on every image load
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = getNodeSize(node);
      // Use ref for stable lookup (doesn't cause callback recreation)
      const img = node.pfp_url ? loadedImagesRef.current.get(node.pfp_url) : null;

      // Draw avatar (using cached offscreen canvas for performance)
      if (img) {
        const cachedCanvas = getAvatarCanvas(img, size);
        const displaySize = size * 2;
        // Draw high-res cached avatar scaled down for crisp display
        ctx.drawImage(
          cachedCanvas,
          0, 0, cachedCanvas.width, cachedCanvas.height,
          node.x! - size, node.y! - size, displaySize, displaySize
        );

        // Draw border
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
        ctx.strokeStyle = node.isCenter ? "#3b82f6" : node.color;
        ctx.lineWidth = node.isCenter ? 3 : 2;
        ctx.stroke();
      } else {
        // Fallback: colored circle with initial
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Draw initial letter
        const fontSize = size * 0.8;
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(
          node.username.charAt(0).toUpperCase(),
          node.x!,
          node.y!
        );

        // Border for center
        if (node.isCenter) {
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
          ctx.strokeStyle = "#1d4ed8";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // LOD: Only draw labels when zoomed in enough
      if (globalScale > LOD_LABEL_THRESHOLD) {
        const fontSize = Math.max(6, 8 / globalScale);
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const label = `@${node.username}`;
        const textWidth = ctx.measureText(label).width;

        // Background for better readability
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillRect(
          node.x! - textWidth / 2 - 2,
          node.y! + size + 3,
          textWidth + 4,
          fontSize + 2
        );

        // Label text
        ctx.fillStyle = node.isCenter ? "#3b82f6" : "#52525b";
        ctx.fillText(label, node.x!, node.y! + size + 4);
      }
    },
    [getNodeSize, imagesLoaded] // imagesLoaded triggers re-render when images ready
  );

  // Stable pointer area paint function
  const nodePointerAreaPaint = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const size = getNodeSize(node);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, size + 5, 0, 2 * Math.PI);
      ctx.fill();
    },
    [getNodeSize]
  );

  // Handle engine stop - pause animation and auto-zoom only on first stop
  const handleEngineStop = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;

    setIsEngineRunning(false);

    // Pause animation loop (critical for performance)
    graph.pauseAnimation();

    // Only auto-zoom on first stop (initial load) - preserve user zoom after that
    if (!hasInitialZoom.current) {
      hasInitialZoom.current = true;

      // Smooth zoom to fit using GSAP
      const currentZoom = graph.zoom() || 1;
      const targetZoom = 0.9;
      const camera = { zoom: currentZoom };

      gsap.to(camera, {
        duration: 0.5,
        zoom: targetZoom,
        ease: "power2.out",
        onUpdate: () => {
          graph.zoom(camera.zoom);
        },
        onComplete: () => {
          graph.centerAt(0, 0);
        },
      });
    }
  }, []);

  // Export graph as PNG - re-renders at fixed 2K resolution for consistency
  const handleExportPNG = useCallback(async (): Promise<void> => {
    // Fixed 2K resolution for consistent exports across all devices
    const exportSize = 2000;

    // Create high-resolution export canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Render graph at high resolution using shared helper
    renderGraphToCanvas({
      ctx,
      exportSize,
      type,
      graphData,
      loadedImages: loadedImagesRef.current,
      centerUsername: centerUser.username,
    });

    // Download as PNG
    const blob = await new Promise<Blob | null>((resolve) => {
      exportCanvas.toBlob(resolve, "image/png");
    });
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `${centerUser.username}-graph-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [centerUser.username, type, graphData]);

  // Get graph as Blob for tokenization - uses shared high-res rendering
  const getGraphBlob = useCallback(async (): Promise<Blob | null> => {
    // Fixed size for tokenization (2K for consistent NFT quality)
    const exportSize = 2000;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return null;

    // Render graph using shared helper
    renderGraphToCanvas({
      ctx,
      exportSize,
      type,
      graphData,
      loadedImages: loadedImagesRef.current,
      centerUsername: centerUser.username,
    });

    // Return blob
    return new Promise<Blob | null>((resolve) => {
      exportCanvas.toBlob(resolve, "image/png");
    });
  }, [centerUser.username, type, graphData]);

  // Tokenize graph data
  const tokenizeData: TokenizeGraphData = useMemo(() => ({
    username: centerUser.username,
    fid: centerUser.fid,
    nodeCount: graphData.nodes.length - 1, // Exclude center user
    graphType: type === "mutuals" ? "All Mutuals" : type === "attention" ? "Attention" : "Influence",
  }), [centerUser, graphData.nodes.length, type]);

  // Configure forces - called after graph renders
  const configureForces = useCallback(() => {
    const fg = graphRef.current;
    if (!fg) return;

    console.log("Configuring forces for", connections.length, "nodes");

    // Charge (repulsion) - tighter spread
    const chargeStrength = connections.length > 50 ? -400 : -300;
    fg.d3Force("charge")?.strength(chargeStrength);

    // Link distance - tighter spread
    const linkDistance = connections.length > 50 ? 120 : 100;
    fg.d3Force("link")?.distance(linkDistance);

    // Disable center force completely to allow spreading
    fg.d3Force("center", null);

    // Collision force to prevent overlap
    fg.d3Force("collision",
      forceCollide()
        .radius((node: any) => getNodeSize(node) + 15)
        .strength(1)
        .iterations(3)
    );

    // Reheat simulation to apply new forces
    fg.d3ReheatSimulation();
  }, [connections.length, getNodeSize]);

  // Apply forces after a short delay to ensure graph is mounted
  useEffect(() => {
    // Immediate attempt
    configureForces();

    // Retry after delays to ensure graph is ready
    const t1 = setTimeout(configureForces, 100);
    const t2 = setTimeout(configureForces, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [graphData, configureForces]);

  // Resume animation when graph data changes (e.g., switching tabs)
  useEffect(() => {
    if (graphRef.current && !isEngineRunning) {
      hasInitialZoom.current = false; // Reset so new data gets initial zoom
      graphRef.current.resumeAnimation();
      setIsEngineRunning(true);
    }
  }, [graphData]);

  if (connections.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">No connections to display</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="graph-container"
      className="relative overflow-hidden border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        onNodeClick={handleNodeClick}
        linkColor={getLinkColor}
        linkWidth={1}
        cooldownTicks={200}
        warmupTicks={100}
        d3AlphaDecay={0.01}
        d3VelocityDecay={0.3}
        onEngineStop={handleEngineStop}
        enableNodeDrag={true}
        minZoom={0.5}
        maxZoom={4}
      />

      {/* Top Bar: Legend + Export Button */}
      <div className="absolute left-2 right-2 top-2 flex flex-col gap-2 sm:left-4 sm:right-4 sm:top-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Legend - sharp style with uppercase */}
        <div className="flex items-center gap-2 border border-zinc-200 bg-white/95 px-3 py-2 text-[10px] uppercase tracking-[0.05em] sm:gap-4 sm:px-4 sm:text-xs dark:border-zinc-700 dark:bg-zinc-900/95">
          <span className="font-medium text-zinc-500">Score</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-[#22c55e] sm:h-3 sm:w-3" />
            <span className="hidden text-zinc-600 dark:text-zinc-400 sm:inline">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-[#eab308] sm:h-3 sm:w-3" />
            <span className="hidden text-zinc-600 dark:text-zinc-400 sm:inline">Med</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 bg-[#71717a] sm:h-3 sm:w-3" />
            <span className="hidden text-zinc-600 dark:text-zinc-400 sm:inline">Low</span>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex items-center gap-2">
          <ExportButton
            onExport={handleExportPNG}
            disabled={isEngineRunning}
          />
          {/* TokenizeButton hidden for now
          <TokenizeButton
            getGraphBlob={getGraphBlob}
            graphData={tokenizeData}
            disabled={isEngineRunning}
          />
          */}
        </div>
      </div>

      {/* Touch hint - mobile only */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 border border-zinc-300 bg-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.05em] text-zinc-600 sm:hidden dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-400">
        Pinch to zoom &bull; Drag to pan
      </div>

      {/* Node Info Card */}
      {selectedNode && (
        <NodeInfoCard
          node={selectedNode}
          position={cardPosition}
          onClose={handleCloseCard}
          onViewProfile={handleViewProfile}
        />
      )}
    </div>
  );
}

// Phase 2.1: Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(ConnectionGraph);
