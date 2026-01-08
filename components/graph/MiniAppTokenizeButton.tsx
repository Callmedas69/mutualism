"use client";

import dynamic from "next/dynamic";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import type { TokenizeGraphData } from "@/types/tokenize";
import type { SnapshotCache } from "@/hooks/useSnapshotCache";

// Lazy load MiniAppTokenizeModal
const MiniAppTokenizeModal = dynamic(() => import("./MiniAppTokenizeModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex items-center gap-2 rounded bg-white px-4 py-3 dark:bg-zinc-800">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    </div>
  ),
});

interface MiniAppTokenizeButtonProps {
  ensureSnapshot: () => Promise<SnapshotCache>;
  graphData: TokenizeGraphData;
  disabled?: boolean;
  isUploading?: boolean;
}

export default function MiniAppTokenizeButton({
  ensureSnapshot,
  graphData,
  disabled = false,
  isUploading = false,
}: MiniAppTokenizeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // In miniapp mode, Farcaster auto-connects wallet - no need to check isConnected
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || isUploading}
        aria-busy={isUploading}
        title="Post your graph to Zora"
        className="flex items-center gap-2 border border-purple-400 bg-purple-50 px-3 py-2.5 min-h-[44px] text-[10px] font-medium uppercase tracking-[0.1em] text-purple-700 transition-all duration-200 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-900 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 dark:border-purple-600 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:border-purple-400 dark:hover:text-purple-100 dark:disabled:border-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
      >
        <Sparkles size={14} />
        Post to Zora
      </button>

      {isModalOpen && (
        <MiniAppTokenizeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ensureSnapshot={ensureSnapshot}
          graphData={graphData}
        />
      )}
    </>
  );
}
