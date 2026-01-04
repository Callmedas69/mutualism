"use client";

import dynamic from "next/dynamic";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import type { TokenizeGraphData } from "@/types/tokenize";

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
  getGraphBlob: () => Promise<Blob | null>;
  graphData: TokenizeGraphData;
  disabled?: boolean;
}

export default function TokenizeButton({
  getGraphBlob,
  graphData,
  disabled = false,
}: TokenizeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isConnected } = useAccount();

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || !isConnected}
        title={!isConnected ? "Connect wallet to tokenize" : "Tokenize your graph on Zora"}
        className="flex items-center gap-2 border border-purple-400 bg-purple-50 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.1em] text-purple-700 transition-all duration-200 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-purple-600 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:border-purple-400 dark:hover:text-purple-100"
      >
        <Sparkles size={12} />
        Tokenize
      </button>

      {isModalOpen && (
        <TokenizeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          getGraphBlob={getGraphBlob}
          graphData={graphData}
        />
      )}
    </>
  );
}
