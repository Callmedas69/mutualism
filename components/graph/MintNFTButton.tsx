"use client";

import dynamic from "next/dynamic";
import { ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import type { TokenizeGraphData } from "@/types/tokenize";
import type { SnapshotCache } from "@/hooks/useSnapshotCache";
import { isContractConfigured } from "@/lib/nft";

// Lazy load MintNFTModal - only loads when user clicks Mint button
const MintNFTModal = dynamic(() => import("./MintNFTModal"), {
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

interface MintNFTButtonProps {
  ensureSnapshot: () => Promise<SnapshotCache>;
  graphData: TokenizeGraphData;
  disabled?: boolean;
  isUploading?: boolean;
}

export default function MintNFTButton({
  ensureSnapshot,
  graphData,
  disabled = false,
  isUploading = false,
}: MintNFTButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();

  // Don't render if contract not configured
  if (!isContractConfigured()) {
    return null;
  }

  const getTitle = () => {
    if (!isConnected) return "Connect wallet to mint";
    if (isUploading) return "Uploading snapshot...";
    return "Mint your graph as an NFT";
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || !isConnected || isUploading}
        aria-busy={isUploading}
        title={getTitle()}
        className="flex items-center gap-1.5 border border-emerald-400 bg-emerald-50 px-2 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-emerald-700 transition-all duration-200 hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px] dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:text-emerald-100"
      >
        <ImageIcon size={12} />
        Mint NFT
      </button>

      {isModalOpen && (
        <MintNFTModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          ensureSnapshot={ensureSnapshot}
          graphData={graphData}
        />
      )}
    </>
  );
}
