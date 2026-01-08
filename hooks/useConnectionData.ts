"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  MutualUser,
  ConnectionUser,
  ConnectionsAllResponse,
  ConnectionsResponse,
} from "@/types/quotient";

// Error types for better user feedback
export type ErrorType = "network" | "rate_limit" | "server" | "unknown";

export interface ConnectionError {
  type: ErrorType;
  message: string;
}

function categorizeError(error: unknown): ConnectionError {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("network") || msg.includes("fetch")) {
      return { type: "network", message: "Network connection lost. Please check your internet." };
    }
    if (msg.includes("429") || msg.includes("rate limit")) {
      return { type: "rate_limit", message: "Too many requests. Please wait a moment." };
    }
    if (msg.includes("500") || msg.includes("server")) {
      return { type: "server", message: "Server error. Please try again later." };
    }
  }
  return { type: "unknown", message: "Something went wrong. Please try again." };
}

interface UseConnectionDataResult {
  mutuals: MutualUser[];
  attention: ConnectionUser[];
  influence: ConnectionUser[];
  loading: boolean;
  error: ConnectionError | null;
  retry: () => void;
  lastUpdated: Date | null;
}

export function useConnectionData(fid: number | undefined): UseConnectionDataResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ConnectionError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [mutuals, setMutuals] = useState<MutualUser[]>([]);
  const [attention, setAttention] = useState<ConnectionUser[]>([]);
  const [influence, setInfluence] = useState<ConnectionUser[]>([]);

  // Retry counter to force re-fetch
  const [retryCount, setRetryCount] = useState(0);

  // Track current request to prevent stale updates
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Retry handler
  const retry = useCallback(() => {
    setError(null);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!fid || typeof fid !== "number" || isNaN(fid)) {
      setLoading(false);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Track this request
    const currentRequestId = ++requestIdRef.current;

    async function fetchData() {
      console.log("Fetching data for fid:", fid);
      setLoading(true);
      setError(null);

      try {
        const [mutualsRes, connectionsRes] = await Promise.all([
          fetch("/api/connections/all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fid }),
            signal: abortController.signal,
          }),
          fetch("/api/connections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fid,
              categories: "attention,influence",
            }),
            signal: abortController.signal,
          }),
        ]);

        // Check if this request is still current (prevents stale data)
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        if (!mutualsRes.ok || !connectionsRes.ok) {
          const errorRes = !mutualsRes.ok ? mutualsRes : connectionsRes;
          const errorText = await errorRes.text();
          throw new Error(`${errorRes.status}: ${errorText}`);
        }

        const mutualsData: ConnectionsAllResponse = await mutualsRes.json();
        const connectionsData: ConnectionsResponse = await connectionsRes.json();

        // Final check before updating state
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        console.log("Fetched mutuals:", mutualsData.mutuals?.length || 0);
        setMutuals(mutualsData.mutuals || []);
        setAttention(connectionsData.attention || []);
        setInfluence(connectionsData.influence || []);
        setLastUpdated(new Date());
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // Check if still current request
        if (currentRequestId !== requestIdRef.current) {
          return;
        }
        console.error("Fetch error:", err);
        setError(categorizeError(err));
      } finally {
        // Only update loading if still current request
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchData();

    // Cleanup: abort on unmount or dependency change
    return () => {
      abortController.abort();
    };
  }, [fid, retryCount]);

  return {
    mutuals,
    attention,
    influence,
    loading,
    error,
    retry,
    lastUpdated,
  };
}
