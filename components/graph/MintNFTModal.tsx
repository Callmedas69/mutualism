"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther, type Address } from "viem";
import Link from "next/link";
import { X, Check, Loader2, ExternalLink, Copy, AlertCircle } from "lucide-react";
import type { TokenizeGraphData } from "@/types/tokenize";
import type { SnapshotView } from "@/types/tokenize";
import type { SnapshotCache } from "@/hooks/useSnapshotCache";
import {
  MUTUALISM_NFT_ADDRESS,
  MUTUALISM_NFT_ABI,
  MUTUALISM_NFT_MINT_PRICE,
  prepareMintParams,
  getOpenSeaUrl,
  getBaseScanTxUrl,
  getViewDisplayName,
  requireContractConfigured,
} from "@/lib/nft";
import { useEthPrice, calculateUsdValue } from "@/hooks/useEthPrice";
import { formatTransactionError } from "@/lib/errors";

interface MintNFTModalProps {
  isOpen: boolean;
  onClose: () => void;
  ensureSnapshot: () => Promise<SnapshotCache>;
  graphData: TokenizeGraphData;
}

type MintStep = "preview" | "uploading" | "minting" | "success" | "error";

const STEPS: { id: MintStep; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "uploading", label: "Upload" },
  { id: "minting", label: "Mint" },
  { id: "success", label: "Done" },
];

export default function MintNFTModal({
  isOpen,
  onClose,
  ensureSnapshot,
  graphData,
}: MintNFTModalProps) {
  const [step, setStep] = useState<MintStep>("preview");
  const [error, setError] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const { address } = useAccount();
  const ethPrice = useEthPrice();
  const priceInUsd = calculateUsdValue(MUTUALISM_NFT_MINT_PRICE, ethPrice);

  // Read current mint price from contract (in case it changed)
  const { data: contractMintPrice } = useReadContract({
    address: MUTUALISM_NFT_ADDRESS,
    abi: MUTUALISM_NFT_ABI,
    functionName: "mintPrice",
  });

  // Mint transaction
  const {
    writeContract: mintNFT,
    data: mintHash,
    isPending: isMintPending,
    error: mintError,
    reset: resetMint,
  } = useWriteContract();

  // Wait for mint transaction
  const {
    isLoading: isMintConfirming,
    isSuccess: isMintConfirmed,
    data: mintReceipt,
  } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Get view type from graphData
  const getViewType = (): SnapshotView => {
    const type = graphData.graphType.toLowerCase();
    if (type.includes("mutual")) return "mutual_circle";
    if (type.includes("attention")) return "attention_circle";
    if (type.includes("influence")) return "influence_circle";
    return "mutual_circle";
  };

  // Handle mint flow
  const handleMint = useCallback(async () => {
    if (!address) {
      setError("Wallet not connected");
      setStep("error");
      return;
    }

    try {
      requireContractConfigured();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Contract not configured");
      setStep("error");
      return;
    }

    try {
      // Step 1: Upload snapshot to IPFS
      setStep("uploading");
      const snapshotResult = await ensureSnapshot();

      // Step 2: Mint NFT
      setStep("minting");

      const viewType = getViewType();
      const mintParams = prepareMintParams(
        viewType,
        graphData.fid,
        snapshotResult.metadataUri
      );

      // Use contract mint price or fallback
      const mintValue = contractMintPrice || parseEther(MUTUALISM_NFT_MINT_PRICE);

      mintNFT({
        address: MUTUALISM_NFT_ADDRESS,
        abi: MUTUALISM_NFT_ABI,
        functionName: "mint",
        args: [
          mintParams.view,
          mintParams.fid,
          mintParams.graphVersion,
          mintParams.metadataUri,
        ],
        value: mintValue,
      });
    } catch (err) {
      console.error("Mint error:", err);
      setError(formatTransactionError(err instanceof Error ? err : String(err)));
      setStep("error");
    }
  }, [address, ensureSnapshot, graphData, mintNFT, contractMintPrice]);

  // Handle mint success - parse token ID from logs
  useEffect(() => {
    if (isMintConfirmed && mintReceipt && step === "minting") {
      // Find SnapshotMinted event in logs
      const snapshotMintedTopic = "0x"; // Will match by event structure
      const transferLog = mintReceipt.logs.find(
        (log) =>
          log.address.toLowerCase() === MUTUALISM_NFT_ADDRESS.toLowerCase() &&
          log.topics.length >= 4
      );

      if (transferLog && transferLog.topics[3]) {
        // Token ID is the 4th topic in Transfer event (indexed)
        // Or parse from SnapshotMinted which has tokenId as first indexed param
        const parsedTokenId = BigInt(transferLog.topics[3]);
        setTokenId(parsedTokenId);
      }

      setStep("success");
    }
  }, [isMintConfirmed, mintReceipt, step]);

  // Handle mint error
  useEffect(() => {
    if (mintError) {
      setError(formatTransactionError(mintError));
      setStep("error");
    }
  }, [mintError]);

  // Copy URL to clipboard
  const handleCopy = useCallback(() => {
    if (tokenId !== null) {
      const url = getOpenSeaUrl(tokenId);
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [tokenId]);

  // Reset state on close
  const handleClose = useCallback(() => {
    setStep("preview");
    setError(null);
    setTokenId(null);
    resetMint();
    onClose();
  }, [onClose, resetMint]);

  // Stable refs for escape handler
  const handleCloseRef = useRef(handleClose);
  const stepRef = useRef(step);
  handleCloseRef.current = handleClose;
  stepRef.current = step;

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      const currentStep = stepRef.current;
      const blockedSteps = ["uploading", "minting"];
      if (e.key === "Escape" && !blockedSteps.includes(currentStep)) {
        handleCloseRef.current();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    setTimeout(() => firstElement?.focus(), 0);

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen, step]);

  if (!isOpen) return null;

  // Progress indicator
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);
  const viewType = getViewType();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mint-modal-title"
        className="relative w-full max-w-md border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        {/* Close button */}
        {step !== "uploading" && step !== "minting" && (
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={20} aria-hidden="true" />
          </button>
        )}

        {/* Progress Steps */}
        <div
          className="mb-6 flex items-center justify-between pr-8"
          role="group"
          aria-label={`Step ${currentStepIndex + 1} of ${STEPS.length - 1}`}
        >
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                aria-current={i === currentStepIndex ? "step" : undefined}
                className={`flex h-6 w-6 items-center justify-center border text-[10px] font-medium sm:h-8 sm:w-8 sm:text-xs ${
                  i < currentStepIndex
                    ? "border-green-500 bg-green-500 text-white"
                    : i === currentStepIndex
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                }`}
              >
                {i < currentStepIndex ? (
                  <Check size={12} className="sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 2 && (
                <div
                  className={`hidden h-px w-4 sm:block sm:w-8 ${
                    i < currentStepIndex ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            <p id="mint-modal-title" className="py-3 text-lg font-bold">
              Mint your graph as an NFT
            </p>

            {/* NFT Name */}
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">NFT Name</p>
              <p className="font-medium text-zinc-900 dark:text-white">
                {getViewDisplayName(viewType)} - @{graphData.username}
              </p>
            </div>

            {/* Details */}
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Graph Type</span>
                  <span className="font-medium">{getViewDisplayName(viewType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Collection</span>
                  <span className="font-medium">Mutualism Snapshot</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <span className="text-zinc-500">Mint Price</span>
                  <span className="font-medium">
                    {MUTUALISM_NFT_MINT_PRICE} ETH
                    {priceInUsd && ` (~$${priceInUsd})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleClose}
                className="flex-1 border border-zinc-300 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                className="flex-1 border border-emerald-500 bg-emerald-500 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:border-emerald-600 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Mint NFT
              </button>
            </div>
          </div>
        )}

        {/* Uploading Step */}
        {step === "uploading" && (
          <div className="space-y-4 text-center">
            <Loader2
              className="mx-auto h-12 w-12 animate-spin text-emerald-500"
              aria-hidden="true"
            />
            <h2 id="mint-modal-title" className="text-xl font-bold">
              Saving your graph...
            </h2>
            <p className="text-sm text-zinc-500">Uploading to IPFS...</p>
          </div>
        )}

        {/* Minting Step */}
        {step === "minting" && (
          <div className="space-y-4 text-center">
            <Loader2
              className="mx-auto h-12 w-12 animate-spin text-emerald-500"
              aria-hidden="true"
            />
            <h2 id="mint-modal-title" className="text-xl font-bold">
              {isMintPending ? "Approve in your wallet" : "Minting..."}
            </h2>
            <p className="text-sm text-zinc-500">
              {isMintPending
                ? `${MUTUALISM_NFT_MINT_PRICE} ETH${priceInUsd ? ` (~$${priceInUsd})` : ""}`
                : "Almost there..."}
            </p>
            {mintHash && !isMintPending && (
              <p className="font-mono text-xs text-zinc-400">
                Tx: {mintHash.slice(0, 8)}...{mintHash.slice(-6)}
              </p>
            )}
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-green-500 bg-green-50 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
            <h2 id="mint-modal-title" className="text-xl font-bold">
              NFT Minted!
            </h2>
            <p className="text-sm text-zinc-500">
              Your snapshot is now an NFT on Base.
            </p>

            {/* NFT Details */}
            <div className="rounded-lg bg-zinc-50 p-4 text-left dark:bg-zinc-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Name</span>
                  <span className="font-medium">
                    {getViewDisplayName(viewType)} - @{graphData.username}
                  </span>
                </div>
                {tokenId !== null && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Token ID</span>
                    <span className="font-mono font-medium">#{tokenId.toString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            {tokenId !== null && (
              <div className="flex items-center gap-2 border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-800">
                <input
                  type="text"
                  value={getOpenSeaUrl(tokenId)}
                  readOnly
                  className="flex-1 truncate bg-transparent font-mono text-xs"
                />
                <button
                  onClick={handleCopy}
                  aria-label={copied ? "Link copied" : "Copy link"}
                  className="border border-zinc-300 p-1.5 transition-colors hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:border-zinc-400 dark:hover:bg-zinc-700"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                </button>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleClose}
                className="flex flex-1 items-center justify-center border border-zinc-300 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-400"
              >
                Close
              </button>
              {tokenId !== null && (
                <a
                  href={getOpenSeaUrl(tokenId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 border border-emerald-500 bg-emerald-500 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:border-emerald-600 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  View on OpenSea
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
            </div>

            {/* BaseScan link */}
            {mintHash && (
              <a
                href={getBaseScanTxUrl(mintHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                View transaction on BaseScan
                <ExternalLink size={10} aria-hidden="true" />
              </a>
            )}
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-red-500 bg-red-50 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
            <h2 id="mint-modal-title" className="text-xl font-bold">
              Something went wrong
            </h2>
            <p className="text-sm text-red-500">{error}</p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleClose}
                className="flex-1 border border-zinc-300 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setError(null);
                  resetMint();
                  setStep("preview");
                }}
                className="flex-1 border border-emerald-500 bg-emerald-500 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:border-emerald-600 hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
