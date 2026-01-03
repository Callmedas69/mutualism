"use client";

import { useMemo, useCallback } from "react";
import type { MutualUser, ConnectionUser } from "@/types/quotient";

export interface GraphNode {
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

export interface GraphLink {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function isMutualUser(user: MutualUser | ConnectionUser): user is MutualUser {
  return "combined_score" in user;
}

function getScoreColor(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio > 0.7) return "#22c55e"; // green
  if (ratio > 0.4) return "#eab308"; // yellow
  return "#71717a"; // gray
}

interface UseGraphDataParams {
  connections: (MutualUser | ConnectionUser)[];
  centerUser: {
    fid: number;
    username: string;
    pfp_url: string | null;
  };
  maxNodes: number;
}

interface UseGraphDataResult {
  graphData: GraphData;
  maxScore: number;
  getNodeSize: (node: GraphNode) => number;
}

export function useGraphData({
  connections,
  centerUser,
  maxNodes,
}: UseGraphDataParams): UseGraphDataResult {
  // Calculate max score first (used by both graphData and getNodeSize)
  const maxScore = useMemo(() => {
    return Math.max(
      ...connections.map((c) =>
        isMutualUser(c) ? c.combined_score : c.score
      ),
      1
    );
  }, [connections]);

  // Transform connections into graph data structure
  const graphData = useMemo(() => {
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
  }, [connections, centerUser, maxNodes, maxScore]);

  // Calculate node size based on score (higher score = bigger node)
  const getNodeSize = useCallback(
    (node: GraphNode) => {
      if (node.isCenter) return 28;

      // Score-based sizing: 12px (low) to 22px (high)
      const minSize = connections.length > 50 ? 10 : 12;
      const maxSize = connections.length > 50 ? 18 : 22;
      const ratio = node.score / maxScore;

      return minSize + (maxSize - minSize) * ratio;
    },
    [connections.length, maxScore]
  );

  return {
    graphData,
    maxScore,
    getNodeSize,
  };
}
