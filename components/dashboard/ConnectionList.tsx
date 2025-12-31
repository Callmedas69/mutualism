"use client";

import { useState, useEffect } from "react";
import type { MutualUser, ConnectionUser } from "@/types/quotient";
import Image from "next/image";
import { URLS } from "@/lib/constants";

const ITEMS_PER_PAGE = 20;

interface ConnectionListProps {
  connections: (MutualUser | ConnectionUser)[];
  type: "mutual" | "attention" | "influence";
}

function isMutualUser(user: MutualUser | ConnectionUser): user is MutualUser {
  return "combined_score" in user;
}

export default function ConnectionList({ connections, type }: ConnectionListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when connections change (e.g., switching tabs)
  useEffect(() => {
    setCurrentPage(1);
  }, [connections]);

  const totalPages = Math.ceil(connections.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, connections.length);
  const paginatedConnections = connections.slice(startIndex, endIndex);

  if (connections.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500 dark:text-zinc-400">
        No connections found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {paginatedConnections.map((user) => (
          <a
            key={user.fid}
            href={`${URLS.warpcast}/${user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 p-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 transition-all duration-300 ease-out hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-0.5"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {user.pfp_url && (
                <Image
                  src={user.pfp_url}
                  alt={user.username}
                  fill
                  className="object-cover"
                  unoptimized // Required for user-generated URLs from arbitrary domains
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium uppercase tracking-wide text-zinc-900 dark:text-white">
                @{user.username}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                <span className="font-mono">#{user.rank}</span>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                {isMutualUser(user) ? (
                  <span>{user.combined_score.toFixed(1)}</span>
                ) : (
                  <span>{user.score}</span>
                )}
              </div>
            </div>
            {type === "mutual" && isMutualUser(user) && (
              <div className="flex flex-col items-end text-[10px] uppercase tracking-wider text-zinc-400">
                <span>A: {user.attention_score.toFixed(1)}</span>
                <span>I: {user.influence_score.toFixed(1)}</span>
              </div>
            )}
          </a>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-xs uppercase tracking-[0.1em] text-zinc-500 sm:text-left dark:text-zinc-400">
            Showing {startIndex + 1}-{endIndex} of {connections.length}
          </p>
          <div className="flex items-center justify-center gap-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-5 py-2.5 text-xs uppercase tracking-[0.1em] font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-white dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-300 disabled:hover:text-zinc-600 dark:disabled:hover:border-zinc-700 dark:disabled:hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              Prev
            </button>
            {/* Page numbers - hidden on mobile */}
            <div className="hidden items-center sm:flex">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 text-xs font-medium border-y border-zinc-300 dark:border-zinc-700 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                      currentPage === pageNum
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            {/* Mobile page indicator */}
            <span className="px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-zinc-500 border-y border-zinc-300 dark:border-zinc-700 sm:hidden dark:text-zinc-400">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-5 py-2.5 text-xs uppercase tracking-[0.1em] font-medium border border-l-0 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-white dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-300 disabled:hover:text-zinc-600 dark:disabled:hover:border-zinc-700 dark:disabled:hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
