"use client";

import { useState, useCallback, useRef } from "react";
import type { SharedConnectionsResponse } from "@/types/quotient";

export type SharedConnectionsErrorType =
  | "not_found"
  | "self_search"
  | "network"
  | "server"
  | "unknown";

export interface SharedConnectionsError {
  type: SharedConnectionsErrorType;
  message: string;
}

function categorizeError(
  status: number,
  message: string
): SharedConnectionsError {
  if (status === 404) {
    return { type: "not_found", message: "User not found" };
  }
  if (status === 400 && message.includes("That's you")) {
    return { type: "self_search", message: "That's you! Search for someone else." };
  }
  if (status >= 500) {
    return { type: "server", message: "Server error. Please try again." };
  }
  return { type: "unknown", message: message || "Something went wrong" };
}

interface UseSharedConnectionsResult {
  result: SharedConnectionsResponse | null;
  loading: boolean;
  error: SharedConnectionsError | null;
  search: (targetUsername: string) => Promise<void>;
  clear: () => void;
}

export function useSharedConnections(
  userFid: number | undefined
): UseSharedConnectionsResult {
  const [result, setResult] = useState<SharedConnectionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SharedConnectionsError | null>(null);

  // Abort controller for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (targetUsername: string) => {
      if (!userFid) {
        setError({ type: "unknown", message: "Not logged in" });
        return;
      }

      const cleanUsername = targetUsername.trim();
      if (!cleanUsername) {
        setError({ type: "unknown", message: "Please enter a username" });
        return;
      }

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/connections/shared", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userFid,
            targetUsername: cleanUsername,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw { status: res.status, message: data.error || "Request failed" };
        }

        const data: SharedConnectionsResponse = await res.json();
        setResult(data);
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        if (
          typeof err === "object" &&
          err !== null &&
          "status" in err &&
          "message" in err
        ) {
          const typedErr = err as { status: number; message: string };
          setError(categorizeError(typedErr.status, typedErr.message));
        } else {
          setError({ type: "network", message: "Network error. Please try again." });
        }
      } finally {
        setLoading(false);
      }
    },
    [userFid]
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    loading,
    error,
    search,
    clear,
  };
}
