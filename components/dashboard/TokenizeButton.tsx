"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";
import type { TokenizeGraphData } from "@/types/tokenize";
import TokenizeModal from "./TokenizeModal";

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
        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-purple-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles size={14} />
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
