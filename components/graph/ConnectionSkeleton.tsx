"use client";

export default function ConnectionSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton - underline style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-0 border-b border-zinc-200 dark:border-zinc-800">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative h-11 w-24 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer sm:w-28"
            />
          ))}
        </div>
        <div className="flex">
          <div className="h-10 w-16 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer border border-zinc-200 dark:border-zinc-700" />
          <div className="h-10 w-16 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer border border-l-0 border-zinc-200 dark:border-zinc-700" />
        </div>
      </div>

      {/* Grid skeleton - sharp cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 p-4"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="h-3 w-10 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              <div className="h-3 w-10 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton - sharp buttons */}
      <div className="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="mx-auto h-4 w-32 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer sm:mx-0" />
        <div className="flex items-center justify-center gap-0">
          <div className="h-10 w-16 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer border border-zinc-200 dark:border-zinc-700" />
          <div className="hidden sm:flex">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-10 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer border-y border-zinc-200 dark:border-zinc-700"
              />
            ))}
          </div>
          <div className="h-10 w-16 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer border border-l-0 border-zinc-200 dark:border-zinc-700" />
        </div>
      </div>
    </div>
  );
}
