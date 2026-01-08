"use client";

import dynamic from "next/dynamic";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import type { TokenizeGraphData } from "@/types/tokenize";
import type { SnapshotCache } from "@/hooks/useSnapshotCache";

// Lazy load TokenizeModal - only loads when user clicks Tokenize button
const TokenizeModal = dynamic(() => import("./TokenizeModal"), {
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

interface TokenizeButtonProps {
  ensureSnapshot: () => Promise<SnapshotCache>;
  graphData: TokenizeGraphData;
  disabled?: boolean;
  isUploading?: boolean;
}

export default function TokenizeButton({
  ensureSnapshot,
  graphData,
  disabled = false,
  isUploading = false,
}: TokenizeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || !isConnected || isUploading}
        aria-busy={isUploading}
        title={!isConnected ? "Connect wallet to post" : "Post your graph to Zora"}
        className="flex items-center gap-1.5 border border-purple-400 bg-purple-50 px-2 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-purple-700 transition-all duration-200 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-900 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px] dark:border-purple-600 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:border-purple-400 dark:hover:text-purple-100"
      >
        <Sparkles size={12} />
        Post to Zora
      </button>

      {isModalOpen && (
        <TokenizeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ensureSnapshot={ensureSnapshot}
          graphData={graphData}
        />
      )}
    </>
  );
}
