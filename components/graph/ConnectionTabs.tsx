"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useFarcasterUser } from "@/context/FarcasterProvider";
import { useConnectionData, type ErrorType } from "@/hooks/useConnectionData";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ConnectionList from "./ConnectionList";
import ConnectionGraph from "./ConnectionGraph";
import ConnectionSkeleton from "./ConnectionSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";

type TabType = "mutuals" | "attention" | "influence";
type ViewType = "list" | "graph";

export default function ConnectionTabs() {
  const { user } = useFarcasterUser();
  const [activeTab, setActiveTab] = useState<TabType>("mutuals");
  const [viewType, setViewType] = useState<ViewType>("list");

  const { mutuals, attention, influence, loading, error, retry } = useConnectionData(user?.fid);

  const tabs: { key: TabType; label: string; count: number | null; description: string }[] = [
    { key: "mutuals", label: "Mutuals", count: mutuals.length, description: "People who engage with you and you engage back" },
    { key: "attention", label: "Attention", count: attention.length, description: "People you engage with the most" },
    { key: "influence", label: "Influence", count: influence.length, description: "People who engage with you the most" },
  ];

  const activeTabData = tabs.find((t) => t.key === activeTab);

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
    // Graph view: spinner style (consistent with image loading overlay)
    if (viewType === "graph") {
      return (
        <div className="relative h-[600px] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 bg-white/80 dark:bg-zinc-900/80 px-6 py-4 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <span className="text-xs uppercase tracking-wider text-zinc-500">Loading...</span>
            </div>
          </div>
        </div>
      );
    }
    // List view: shimmer skeleton
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
            onClick={retry}
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
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-zinc-200 bg-transparent p-0 dark:border-zinc-800 sm:w-auto">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="relative shrink-0 rounded-none border-none bg-transparent px-2 py-2.5 text-[10px] uppercase tracking-[0.05em] font-medium shadow-none transition-colors duration-200 sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.1em] data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none data-[state=inactive]:text-zinc-500 hover:text-zinc-700 dark:data-[state=active]:text-white dark:data-[state=inactive]:text-zinc-500 dark:hover:text-zinc-300 data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-zinc-900 dark:data-[state=active]:after:bg-white"
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1 text-[9px] text-zinc-400 sm:ml-2 sm:text-[10px]">{tab.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* View Toggle */}
        <div className="flex">
            <button
              onClick={() => setViewType("list")}
              className={`min-h-[44px] px-5 py-3 text-xs uppercase tracking-[0.1em] font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                viewType === "list"
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                  : "bg-transparent text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-white dark:hover:text-white"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewType("graph")}
              className={`min-h-[44px] px-5 py-3 text-xs uppercase tracking-[0.1em] font-medium border border-l-0 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                viewType === "graph"
                  ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                  : "bg-transparent text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-white dark:hover:text-white"
              }`}
            >
              Graph
            </button>
          </div>
      </div>

      {/* Tab description */}
      {activeTabData && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 -mt-2">
          {activeTabData.description}
        </p>
      )}

      {/* Content with fade transition - both views rendered, one hidden */}
      {tabs.map((tab) => (
        <TabsContent
          key={tab.key}
          value={tab.key}
          className="mt-0 animate-in fade-in duration-300"
        >
          {/* List View */}
          <div className={viewType === "list" ? "block" : "hidden"}>
            <ConnectionList
              connections={getConnections(tab.key)}
              type={tab.key === "mutuals" ? "mutual" : tab.key}
            />
          </div>
          {/* Graph View - stays mounted to preserve state */}
          <div className={viewType === "graph" ? "block" : "hidden"}>
            <ErrorBoundary name="ConnectionGraph">
              <ConnectionGraph
                connections={getConnections(tab.key)}
                centerUser={{
                  fid: user?.fid || 0,
                  username: user?.username || "",
                  pfp_url: user?.pfp_url || null,
                }}
                type={tab.key}
              />
            </ErrorBoundary>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
