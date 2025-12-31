"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFarcasterUser } from "@/context/FarcasterProvider";
import type {
  MutualUser,
  ConnectionUser,
  ConnectionsAllResponse,
  ConnectionsResponse,
} from "@/types/quotient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConnectionList from "./ConnectionList";
import ConnectionGraph from "./ConnectionGraph";
import ConnectionSkeleton from "./ConnectionSkeleton";

type TabType = "mutuals" | "attention" | "influence";
type ViewType = "list" | "graph";

// Error types for better user feedback
type ErrorType = "network" | "rate_limit" | "server" | "unknown";

function categorizeError(error: unknown): { type: ErrorType; message: string } {
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

export default function ConnectionTabs() {
  const { user } = useFarcasterUser();
  const [activeTab, setActiveTab] = useState<TabType>("mutuals");
  const [viewType, setViewType] = useState<ViewType>("list");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null);

  const [mutuals, setMutuals] = useState<MutualUser[]>([]);
  const [attention, setAttention] = useState<ConnectionUser[]>([]);
  const [influence, setInfluence] = useState<ConnectionUser[]>([]);

  // Retry counter to force re-fetch
  const [retryCount, setRetryCount] = useState(0);

  // Track current request to prevent stale updates
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Retry handler
  const handleRetry = useCallback(() => {
    setError(null);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const fid = user?.fid;
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
  }, [user?.fid, retryCount]); // retryCount triggers re-fetch on retry button click

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: "mutuals", label: "All Mutuals", count: mutuals.length },
    { key: "attention", label: "Attention", count: attention.length },
    { key: "influence", label: "Influence", count: influence.length },
  ];

  const getConnections = (tab: TabType) => {
    switch (tab) {
      case "mutuals":
        return mutuals;
      case "attention":
        return attention;
      case "influence":
        return influence;
    }
  };

  if (loading) {
    return <ConnectionSkeleton />;
  }

  if (error) {
    const errorTitles: Record<ErrorType, string> = {
      network: "Connection Lost",
      rate_limit: "Slow Down",
      server: "Server Hiccup",
      unknown: "Something Broke",
    };

    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {errorTitles[error.type]}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
            {error.message}
          </h2>
          <p className="mt-3 text-sm uppercase tracking-[0.05em] text-zinc-500 dark:text-zinc-400">
            {error.type === "rate_limit"
              ? "Wait a few seconds before retrying."
              : "Click retry to try again."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="px-6 py-3 text-xs uppercase tracking-[0.15em] font-medium border border-zinc-900 text-zinc-900 transition-all duration-200 hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-900"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 text-xs uppercase tracking-[0.15em] font-medium text-zinc-500 transition-all duration-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabType)}
      className="space-y-6"
    >
      {/* Header with tabs and view toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs - Underline style with shadcn */}
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-zinc-200 bg-transparent p-0 dark:border-zinc-800 sm:w-auto overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="relative shrink-0 rounded-none border-none bg-transparent px-4 py-3 text-xs uppercase tracking-[0.1em] font-medium shadow-none transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none data-[state=inactive]:text-zinc-500 hover:text-zinc-700 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-zinc-500 dark:hover:text-zinc-300 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-zinc-900 dark:data-[state=active]:after:bg-white"
            >
              {tab.label}
              <span className="ml-2 text-[10px] text-zinc-400">{tab.count}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* View Toggle - Sharp border style */}
        <div className="flex">
          <button
            onClick={() => setViewType("list")}
            className={`px-4 py-2 text-xs uppercase tracking-[0.1em] font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              viewType === "list"
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                : "bg-transparent text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-white dark:hover:text-white"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewType("graph")}
            className={`px-4 py-2 text-xs uppercase tracking-[0.1em] font-medium border border-l-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
              viewType === "graph"
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                : "bg-transparent text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-white dark:hover:text-white"
            }`}
          >
            Graph
          </button>
        </div>
      </div>

      {/* Content with fade transition */}
      {tabs.map((tab) => (
        <TabsContent
          key={tab.key}
          value={tab.key}
          className="mt-0 animate-in fade-in duration-300"
        >
          <div key={viewType} className="animate-in fade-in duration-200">
            {viewType === "list" ? (
              <ConnectionList
                connections={getConnections(tab.key)}
                type={tab.key === "mutuals" ? "mutual" : tab.key}
              />
            ) : (
              <ConnectionGraph
                connections={getConnections(tab.key)}
                centerUser={{
                  fid: user?.fid || 0,
                  username: user?.username || "",
                  pfp_url: user?.pfp_url || null,
                }}
                type={tab.key}
              />
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
