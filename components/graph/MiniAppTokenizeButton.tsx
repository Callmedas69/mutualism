"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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
  requiresShare?: boolean;
  hasShared?: boolean;
}

export default function MiniAppTokenizeButton({
  ensureSnapshot,
  graphData,
  disabled = false,
  isUploading = false,
  requiresShare = false,
  hasShared = false,
}: MiniAppTokenizeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Gating: If share is required but not done, disable button
  const isGated = requiresShare && !hasShared;

  // In miniapp mode, Farcaster auto-connects wallet - no need to check isConnected
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || isUploading || isGated}
        aria-busy={isUploading}
        title={isGated ? "Share your graph first" : "Post your graph to Zora"}
        className="flex items-center gap-2 border border-[#f25b28] bg-orange-50 px-3 py-2.5 min-h-[44px] text-[10px] font-medium uppercase tracking-[0.1em] text-[#f25b28] transition-all duration-200 hover:border-[#d94d1f] hover:bg-orange-100 hover:text-[#d94d1f] disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] dark:border-[#f25b28] dark:bg-orange-950/50 dark:text-orange-300 dark:hover:border-orange-400 dark:hover:text-orange-100 dark:disabled:border-zinc-700 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
      >
        <Image src="/zora_icon.svg" alt="" width={14} height={14} className="rounded-full" />
        {isGated ? "Share First" : "Post to Zora"}
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
