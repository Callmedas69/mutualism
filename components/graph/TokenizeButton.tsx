"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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
        className="flex items-center gap-2 border border-[#f25b28] bg-orange-50 px-5 py-2.5 min-h-[36px] text-[10px] font-medium uppercase tracking-[0.1em] text-[#f25b28] transition-all duration-200 hover:border-[#d94d1f] hover:bg-orange-100 hover:text-[#d94d1f] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] dark:border-[#f25b28] dark:bg-orange-950/50 dark:text-orange-300 dark:hover:border-orange-400 dark:hover:text-orange-100"
      >
        <Image src="/zora_icon.svg" alt="" width={14} height={14} className="rounded-full" />
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
