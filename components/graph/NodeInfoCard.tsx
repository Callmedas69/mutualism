"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface NodeInfoCardProps {
  node: {
    username: string;
    pfp_url: string | null;
    score: number;
    isCenter: boolean;
    color: string;
  };
  position: { x: number; y: number };
  onClose: () => void;
  onViewProfile: () => void;
}

export default function NodeInfoCard({
  node,
  position,
  onClose,
  onViewProfile,
}: NodeInfoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  // Track if the card just mounted to ignore the opening click
  const justMountedRef = useRef(true);
  // Stable ref for onClose to avoid re-adding listeners
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Click outside to close - listener added once
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore the first click (the one that opened the card)
      if (justMountedRef.current) {
        justMountedRef.current = false;
        return;
      }

      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onCloseRef.current();
      }
    };

    // Use mouseup instead of mousedown to ensure the opening click completes first
    document.addEventListener("mouseup", handleClickOutside);

    return () => {
      document.removeEventListener("mouseup", handleClickOutside);
    };
  }, []);

  // Escape key to close - listener added once
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div
      ref={cardRef}
      className="absolute z-50 min-w-[220px] animate-in fade-in zoom-in-95 duration-200"
      style={{
        left: Math.min(position.x, window.innerWidth - 240),
        top: Math.min(position.y, window.innerHeight - 200),
      }}
    >
      <div className="border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 min-h-[44px] min-w-[44px] p-2 text-zinc-400 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:hover:text-white"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 p-4">
          {node.pfp_url ? (
            <Image
              src={node.pfp_url}
              alt={node.username}
              width={48}
              height={48}
              className="rounded-full border-2"
              style={{ borderColor: node.color }}
              unoptimized // Required for user-generated URLs from arbitrary domains
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: node.color }}
            >
              {node.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs uppercase tracking-[0.1em] font-semibold text-zinc-900 dark:text-white">
              @{node.username}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Score: <span className="font-mono" style={{ color: node.color }}>{Math.round(node.score)}</span>
            </p>
          </div>
        </div>

        {/* View profile button */}
        <button
          onClick={onViewProfile}
          className="w-full min-h-[44px] border-t border-zinc-200 px-4 py-3 text-[10px] uppercase tracking-[0.15em] font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          View on Warpcast
        </button>
      </div>
    </div>
  );
}
