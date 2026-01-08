"use client";

import React, { useRef, useCallback, useMemo, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { forceCollide } from "d3-force";
import gsap from "gsap";
import type { MutualUser, ConnectionUser } from "@/types/quotient";
import type { TokenizeGraphData } from "@/types/tokenize";
import { URLS } from "@/lib/constants";
import { useGraphData, type GraphNode, type GraphLink } from "@/hooks/useGraphData";
import { useImagePreloader, getAvatarCanvas } from "@/hooks/useImagePreloader";
import { useSnapshotCache } from "@/hooks/useSnapshotCache";
import { Loader2 } from "lucide-react";
import NodeInfoCard from "./NodeInfoCard";
import ExportButton from "./ExportButton";
import ShareGraphButton from "./ShareGraphButton";
import TokenizeButton from "./TokenizeButton";
import MiniAppTokenizeButton from "./MiniAppTokenizeButton";
import MintNFTButton from "./MintNFTButton";
import { useMiniAppContext } from "@/context/MiniAppProvider";

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

// Shared high-resolution graph rendering function
function renderGraphToCanvas(options: RenderToCanvasOptions): void {
  const { ctx, exportSize, type, graphData, loadedImages, centerUsername } = options;

  const footerHeight = 200;
  const graphAreaBottom = exportSize - footerHeight;
  const uiScale = exportSize / 1200;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Pastel gradient background
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

  const graphAreaSize = graphAreaBottom - 40;
  const scale = graphAreaSize / Math.max(graphWidth, graphHeight);
  const offsetX = exportSize / 2 - graphCenterX * scale;
  const offsetY = graphAreaBottom / 2 - graphCenterY * scale;

  const tx = (x: number) => x * scale + offsetX;
  const ty = (y: number) => y * scale + offsetY;

  // Draw links
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

  // Draw nodes
  for (const node of graphData.nodes) {
    if (node.x === undefined || node.y === undefined) continue;

    const baseSize = node.isCenter ? 28 : 20;
    const nodeSize = baseSize * scale;
    const x = tx(node.x);
    const y = ty(node.y);

    const img = node.pfp_url ? loadedImages.get(node.pfp_url) : null;

    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x - nodeSize, y - nodeSize, nodeSize * 2, nodeSize * 2);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.strokeStyle = node.isCenter ? "#3b82f6" : (node.color || "#93c5fd");
      ctx.lineWidth = (node.isCenter ? 4 : 2.5) * uiScale;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, y, nodeSize, 0, Math.PI * 2);
      ctx.fillStyle = node.color || "#93c5fd";
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
  }

  // Footer panel
  const footerY = graphAreaBottom;
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, footerY, exportSize, footerHeight);

  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(exportSize, footerY);
  ctx.stroke();

  const margin = 32 * uiScale;
  const columnDivider = exportSize * 0.28;

  const drawSpacedText = (text: string, x: number, y: number, spacing: number) => {
    ctx.textAlign = "left";
    let currentX = x;
    for (const char of text) {
      ctx.fillText(char, currentX, y);
      currentX += ctx.measureText(char).width + spacing;
    }
  };

  // Branding
  const leftX = margin;
  let leftY = footerY + 45 * uiScale;

  ctx.font = `bold ${Math.round(42 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#f25b28";
  ctx.fillText("M", leftX, leftY);
  const mWidth = ctx.measureText("M").width + 0.1 * uiScale;

  ctx.fillStyle = "#ffffff";
  let currentX = leftX + mWidth;
  for (const char of "UTUALISM") {
    ctx.fillText(char, currentX, leftY);
    currentX += ctx.measureText(char).width + 0.1 * uiScale;
  }

  leftY += 22 * uiScale;
  const tabLabel = type === "mutuals" ? "ALL MUTUALS" : type === "attention" ? "ATTENTION" : "INFLUENCE";
  ctx.font = `${Math.round(14 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#a1a1aa";
  ctx.textAlign = "left";
  ctx.fillText(`${tabLabel} • @${centerUsername}`, leftX, leftY);

  leftY += 22 * uiScale;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase();
  ctx.font = `${Math.round(12 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#52525b";
  ctx.fillText(dateStr, leftX, leftY);

  // Top connections
  const rightX = columnDivider + 20 * uiScale;
  let rightY = footerY + 24 * uiScale;

  ctx.font = `500 ${Math.round(11 * uiScale)}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "#a1a1aa";
  drawSpacedText("TOP CONNECTIONS", rightX, rightY, 1.5 * uiScale);

  const topConnections = graphData.nodes
    .filter(n => !n.isCenter)
    .sort((a, b) => b.score - a.score)
    .slice(0, 28);

  ctx.font = `${Math.round(9 * uiScale)}px "SF Mono", Monaco, monospace`;
  ctx.fillStyle = "#d4d4d8";
  ctx.textAlign = "left";

  const availableWidth = exportSize - rightX - 20 * uiScale;
  const colWidth = availableWidth / 7;
  const lineHeight = 20 * uiScale;
  const rowsPerCol = 4;
  const maxUsernameLength = 13;

  topConnections.forEach((node, i) => {
    const colIndex = Math.floor(i / rowsPerCol);
    const rowIndex = i % rowsPerCol;
    const x = rightX + colIndex * colWidth;
    const y = rightY + 18 * uiScale + rowIndex * lineHeight;
    let username = node.username;
    if (username.length > maxUsernameLength) {
      username = username.slice(0, maxUsernameLength - 1) + "…";
    }
    ctx.fillText(`@${username}`, x, y);
  });

  ctx.strokeStyle = "#3f3f46";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(columnDivider, footerY + 16 * uiScale);
  ctx.lineTo(columnDivider, footerY + footerHeight - 16 * uiScale);
  ctx.stroke();
}

function ConnectionGraph({ connections, centerUser, type }: ConnectionGraphProps) {
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInitialZoom = useRef(false);
  const forcesConfiguredRef = useRef(false);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isEngineRunning, setIsEngineRunning] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });

  const { isMiniApp, composeCast } = useMiniAppContext();

  // Limit nodes based on count
  const maxNodes = connections.length > 100 ? 50 : connections.length > 50 ? 75 : 100;

  // Use extracted hooks
  const { graphData, maxScore, getNodeSize } = useGraphData({
    connections,
    centerUser,
    maxNodes,
  });

  // Memoize to prevent infinite re-renders in useImagePreloader
  const connectionPfps = useMemo(
    () => connections.map(c => c.pfp_url),
    [connections]
  );

  const { loadedImagesRef, imagesLoaded } = useImagePreloader({
    centerUserPfp: centerUser.pfp_url,
    connectionPfps,
    maxNodes,
  });

  // Graph is ready when images are loaded (physics can still run in background)
  const isGraphReady = imagesLoaded;

  // Dimension tracking - uses ResizeObserver to detect visibility changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const width = container.clientWidth;
      const height = Math.max(450, window.innerHeight - 180);
      // Only update if we have valid dimensions (not hidden)
      if (width > 0) {
        setDimensions({ width, height });
      }
    };

    // ResizeObserver fires when element becomes visible (goes from 0 to non-zero size)
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);
    window.addEventListener("resize", updateDimensions);

    // Initial dimension check
    updateDimensions();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // GSAP smooth camera focus on node click
  const handleNodeClick = useCallback((node: any, event: MouseEvent) => {
    const graph = graphRef.current;
    const container = containerRef.current;

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

    const currentZoom = graph.zoom() || 1;
    const targetZoom = 2.5;
    const camera = { zoom: currentZoom };

    gsap.to(camera, {
      duration: 0.5,
      zoom: targetZoom,
      ease: "power2.out",
      onUpdate: () => graph.zoom(camera.zoom),
      onComplete: () => {
        graph.centerAt(node.x, node.y);
        setSelectedNode(node);
      },
    });
  }, []);

  const handleCloseCard = useCallback(() => setSelectedNode(null), []);

  const handleViewProfile = useCallback(() => {
    if (selectedNode) {
      window.open(`${URLS.warpcast}/${selectedNode.username}`, "_blank");
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Optimized node rendering with LOD
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const size = getNodeSize(node);
      const img = node.pfp_url ? loadedImagesRef.current.get(node.pfp_url) : null;

      if (img) {
        const cachedCanvas = getAvatarCanvas(img, size);
        const displaySize = size * 2;
        ctx.drawImage(
          cachedCanvas,
          0, 0, cachedCanvas.width, cachedCanvas.height,
          node.x! - size, node.y! - size, displaySize, displaySize
        );

        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
        ctx.strokeStyle = node.isCenter ? "#3b82f6" : node.color;
        ctx.lineWidth = node.isCenter ? 3 : 2;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();

        const fontSize = size * 0.8;
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(node.username.charAt(0).toUpperCase(), node.x!, node.y!);

        if (node.isCenter) {
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, size, 0, 2 * Math.PI);
          ctx.strokeStyle = "#1d4ed8";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }

      // LOD: Only draw labels when zoomed in
      if (globalScale > LOD_LABEL_THRESHOLD) {
        const fontSize = Math.max(6, 8 / globalScale);
        ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";

        const label = `@${node.username}`;
        const textWidth = ctx.measureText(label).width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.fillRect(node.x! - textWidth / 2 - 2, node.y! + size + 3, textWidth + 4, fontSize + 2);

        ctx.fillStyle = node.isCenter ? "#3b82f6" : "#52525b";
        ctx.fillText(label, node.x!, node.y! + size + 4);
      }
    },
    [getNodeSize, imagesLoaded]
  );

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

  const handleEngineStop = useCallback(() => {
    setIsEngineRunning(false);  // Always execute first - clears loading state

    const graph = graphRef.current;
    if (!graph) return;

    graph.pauseAnimation();

    if (!hasInitialZoom.current) {
      hasInitialZoom.current = true;
      graph.zoomToFit(400, 80);
    }
  }, []);

  // Export as PNG
  const handleExportPNG = useCallback(async (): Promise<void> => {
    const exportSize = 2000;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    renderGraphToCanvas({
      ctx,
      exportSize,
      type,
      graphData,
      loadedImages: loadedImagesRef.current,
      centerUsername: centerUser.username,
    });

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

  // Get graph as Blob for tokenization
  const getGraphBlob = useCallback(async (): Promise<Blob | null> => {
    const exportSize = 2000;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return null;

    renderGraphToCanvas({
      ctx,
      exportSize,
      type,
      graphData,
      loadedImages: loadedImagesRef.current,
      centerUsername: centerUser.username,
    });

    return new Promise<Blob | null>((resolve) => {
      exportCanvas.toBlob(resolve, "image/png");
    });
  }, [centerUser.username, type, graphData]);

  // Tokenize graph data
  // Note: nodeCount removed per PINATA_RESTRUCTURING.md (forbidden field)
  const tokenizeData: TokenizeGraphData = useMemo(() => ({
    username: centerUser.username,
    fid: centerUser.fid,
    graphType: type === "mutuals" ? "All Mutuals" : type === "attention" ? "Attention" : "Influence",
  }), [centerUser, type]);

  // Snapshot cache for Share and Post to Zora (reusable upload)
  const {
    ensureSnapshot,
    clearCache: clearSnapshotCache,
    isUploading: isSnapshotUploading,
    canSnapshot,
  } = useSnapshotCache({
    getGraphBlob,
    graphData: tokenizeData,
    isGraphReady,
  });

  // Configure forces
  const configureForces = useCallback(() => {
    const fg = graphRef.current;
    if (!fg || forcesConfiguredRef.current) return;
    forcesConfiguredRef.current = true;

    const chargeStrength = connections.length > 50 ? -400 : -300;
    fg.d3Force("charge")?.strength(chargeStrength);

    const linkDistance = connections.length > 50 ? 120 : 100;
    fg.d3Force("link")?.distance(linkDistance);

    fg.d3Force("center", null);

    fg.d3Force("collision",
      forceCollide()
        .radius((node: any) => getNodeSize(node) + 15)
        .strength(1)
        .iterations(3)
    );

    fg.d3ReheatSimulation();
  }, [connections.length, getNodeSize]);

  useEffect(() => {
    const timeoutId = setTimeout(configureForces, 300);
    return () => clearTimeout(timeoutId);
  }, [graphData, configureForces]);

  useEffect(() => {
    forcesConfiguredRef.current = false;
  }, [graphData]);

  useEffect(() => {
    if (graphRef.current && !isEngineRunning) {
      hasInitialZoom.current = false;
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
      role="application"
      aria-label={`Interactive ${type} connection graph for ${centerUser.username} with ${connections.length} connections`}
      className="relative overflow-hidden border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
    >
      {/* Graph Canvas with smooth blur transition */}
      <div className={`transition-[filter] duration-700 ease-out ${!isGraphReady ? "blur-sm" : "blur-0"}`}>
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
      </div>

      {/* Loading Overlay - fades out smoothly */}
      <div
        role="status"
        aria-live="polite"
        className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-500 ease-out ${isGraphReady ? "opacity-0" : "opacity-100"}`}
      >
        <div className="flex flex-col items-center gap-2 bg-white/80 dark:bg-zinc-900/80 px-6 py-4 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" aria-hidden="true" />
          <span className="text-xs uppercase tracking-wider text-zinc-500">
            {isGraphReady ? "Graph loaded" : "Loading graph..."}
          </span>
        </div>
      </div>

      {/* Top Bar */}
      <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
        {/* Mutuality Legend - hidden in miniapp to prevent overflow */}
        {!isMiniApp && (
          <div className="flex items-center gap-2 border border-zinc-200 bg-white/95 px-3 py-2 text-[11px] uppercase tracking-[0.05em] sm:px-4 sm:text-xs dark:border-zinc-700 dark:bg-zinc-900/95">
            <span className="font-medium text-zinc-500">Mutuality</span>
            <div
              className="h-2 w-16 rounded-sm sm:h-3 sm:w-24"
              style={{ background: "linear-gradient(to right, #93c5fd, #1e40af)" }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isMiniApp ? (
            <>
              <ShareGraphButton
                graphType={type === "mutuals" ? "Mutuals" : type === "attention" ? "Attention" : "Influence"}
                ensureSnapshot={ensureSnapshot}
                composeCast={composeCast}
                disabled={!canSnapshot || isEngineRunning}
                isUploading={isSnapshotUploading}
              />
              <MiniAppTokenizeButton
                ensureSnapshot={ensureSnapshot}
                graphData={tokenizeData}
                disabled={!canSnapshot || isEngineRunning}
                isUploading={isSnapshotUploading}
              />
              <MintNFTButton
                ensureSnapshot={ensureSnapshot}
                graphData={tokenizeData}
                disabled={!canSnapshot || isEngineRunning}
                isUploading={isSnapshotUploading}
              />
            </>
          ) : (
            <>
              <ExportButton
                onExport={handleExportPNG}
                disabled={isEngineRunning}
              />
              <TokenizeButton
                ensureSnapshot={ensureSnapshot}
                graphData={tokenizeData}
                disabled={!canSnapshot || isEngineRunning}
                isUploading={isSnapshotUploading}
              />
              <MintNFTButton
                ensureSnapshot={ensureSnapshot}
                graphData={tokenizeData}
                disabled={!canSnapshot || isEngineRunning}
                isUploading={isSnapshotUploading}
              />
            </>
          )}
        </div>
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

export default React.memo(ConnectionGraph);
