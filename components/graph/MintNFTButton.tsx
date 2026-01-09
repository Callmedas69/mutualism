"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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
      <div className="flex items-center gap-2 border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs uppercase tracking-wide">Loading...</span>
      </div>
    </div>
  ),
});

interface MintNFTButtonProps {
  ensureSnapshot: () => Promise<SnapshotCache>;
  graphData: TokenizeGraphData;
  disabled?: boolean;
  isUploading?: boolean;
  requiresShare?: boolean;
  hasShared?: boolean;
}

export default function MintNFTButton({
  ensureSnapshot,
  graphData,
  disabled = false,
  isUploading = false,
  requiresShare = false,
  hasShared = false,
}: MintNFTButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();

  // Don't render if contract not configured
  if (!isContractConfigured()) {
    return null;
  }

  // Gating: If share is required but not done, disable button
  const isGated = requiresShare && !hasShared;

  const getTitle = () => {
    if (isGated) return "Share your graph first";
    if (!isConnected) return "Connect wallet first";
    if (isUploading) return "Saving...";
    return "Make it an NFT";
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || !isConnected || isUploading || isGated}
        aria-busy={isUploading}
        title={getTitle()}
        className="flex items-center gap-2 border border-emerald-400 bg-emerald-50 px-3 py-2.5 min-h-[44px] text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-700 transition-all duration-200 hover:border-emerald-600 hover:bg-emerald-100 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:text-emerald-100"
      >
        <Image src="/icon-1024.svg" alt="" width={14} height={14} className="rounded-sm" />
        {isGated ? "Share First" : "Mint NFT"}
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
