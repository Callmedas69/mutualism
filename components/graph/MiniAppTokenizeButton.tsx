"use client";

import dynamic from "next/dynamic";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import type { TokenizeGraphData } from "@/types/tokenize";

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
  getGraphBlob: () => Promise<Blob | null>;
  graphData: TokenizeGraphData;
  disabled?: boolean;
}

export default function MiniAppTokenizeButton({
  getGraphBlob,
  graphData,
  disabled = false,
}: MiniAppTokenizeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // In miniapp mode, Farcaster auto-connects wallet - no need to check isConnected
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        title="Tokenize your graph on Zora"
        className="flex items-center gap-1.5 border border-purple-400 bg-purple-50 px-2 py-1.5 text-[9px] font-medium uppercase tracking-[0.1em] text-purple-700 transition-all duration-200 hover:border-purple-600 hover:bg-purple-100 hover:text-purple-900 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px] dark:border-purple-600 dark:bg-purple-950/50 dark:text-purple-300 dark:hover:border-purple-400 dark:hover:text-purple-100"
      >
        <Sparkles size={12} />
        Tokenize
      </button>

      {isModalOpen && (
        <MiniAppTokenizeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          getGraphBlob={getGraphBlob}
          graphData={graphData}
        />
      )}
    </>
  );
}
