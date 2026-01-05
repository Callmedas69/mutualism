"use client";

import { useMiniApp } from "@/hooks/useMiniApp";

export default function GallerySkeleton() {
  const { isMiniApp } = useMiniApp();

  return (
    <div className={`mx-auto max-w-7xl px-4 pb-safe sm:px-6 lg:px-8 ${isMiniApp ? "py-2" : "py-6 sm:py-8"}`}>
      {/* Header skeleton */}
      <div className={isMiniApp ? "mb-4" : "mb-8 sm:mb-10"}>
        <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
        <div className="mt-2 h-8 w-48 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              <div className="h-2.5 w-8 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
