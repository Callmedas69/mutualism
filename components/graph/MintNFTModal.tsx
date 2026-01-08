"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther } from "viem";
import { X, Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";
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
      const transferLog = mintReceipt.logs.find(
        (log) =>
          log.address.toLowerCase() === MUTUALISM_NFT_ADDRESS.toLowerCase() &&
          log.topics.length >= 4
      );

      if (transferLog && transferLog.topics[3]) {
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
  const isProcessing = ["uploading", "minting"].includes(step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mint-modal-title"
        className="relative w-full max-w-sm border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        {/* Close button */}
        {!isProcessing && (
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}

        {/* Progress Steps - Centered like MiniAppTokenizeModal */}
        <div
          className="mb-5 flex items-center justify-center gap-2"
          role="group"
          aria-label={`Step ${currentStepIndex + 1} of ${STEPS.length - 1}`}
        >
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                aria-current={i === currentStepIndex ? "step" : undefined}
                aria-label={`${s.label}: ${i < currentStepIndex ? "completed" : i === currentStepIndex ? "current" : "pending"}`}
                className={`flex h-6 w-6 items-center justify-center text-[10px] font-bold ${
                  i < currentStepIndex
                    ? "bg-green-500 text-white"
                    : i === currentStepIndex
                    ? "bg-emerald-500 text-white"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
                }`}
              >
                {i < currentStepIndex ? <Check size={12} aria-hidden="true" /> : i + 1}
              </div>
              {i < STEPS.length - 2 && (
                <div
                  className={`h-px w-6 ${i < currentStepIndex ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            <h2 id="mint-modal-title" className="text-center text-base font-bold">
              Mint as NFT
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
                <span className="text-zinc-500">Name</span>
                <span className="font-medium">{getViewDisplayName(viewType)} - @{graphData.username}</span>
              </div>
              <div className="flex justify-between bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
                <span className="text-zinc-500">Collection</span>
                <span className="font-medium">Mutualism Snapshot</span>
              </div>
              <div className="flex justify-between bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
                <span className="text-zinc-500">Price</span>
                <span className="font-medium">
                  {MUTUALISM_NFT_MINT_PRICE} ETH{priceInUsd && ` (~$${priceInUsd})`}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 border border-zinc-300 bg-white py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleMint}
                className="flex-1 bg-emerald-500 py-2.5 text-xs font-medium uppercase tracking-wide text-white"
              >
                Mint NFT
              </button>
            </div>
          </div>
        )}

        {/* Processing Steps */}
        {isProcessing && (
          <div className="space-y-4 py-4 text-center" role="status" aria-live="polite">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-500" aria-hidden="true" />
            <h2 id="mint-modal-title" className="text-base font-bold">
              {step === "uploading" && "Saving your graph..."}
              {step === "minting" && (isMintPending ? "Confirm in wallet" : "Minting...")}
            </h2>
            <p className="text-xs text-zinc-500">
              {step === "uploading" && "Almost ready..."}
              {step === "minting" && (isMintPending
                ? `${MUTUALISM_NFT_MINT_PRICE} ETH${priceInUsd ? ` (~$${priceInUsd})` : ""}`
                : "Making it official..."
              )}
            </p>
            {mintHash && step === "minting" && !isMintPending && (
              <p className="font-mono text-xs text-zinc-400">
                Tx: {mintHash.slice(0, 8)}...{mintHash.slice(-6)}
              </p>
            )}
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-4 text-center" role="status" aria-live="polite">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500 animate-in zoom-in-50 duration-300">
              <Check className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="mint-modal-title" className="text-lg font-bold">You got it!</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your NFT is live on Base
              </p>
            </div>

            {tokenId !== null && (
              <p className="font-mono text-xs text-zinc-500">
                Token #{tokenId.toString()}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {tokenId !== null && (
                <a
                  href={getOpenSeaUrl(tokenId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1 bg-emerald-500 py-2.5 text-xs font-medium uppercase tracking-wide text-white"
                >
                  View on OpenSea
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
              {mintHash && (
                <a
                  href={getBaseScanTxUrl(mintHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-1 border border-zinc-300 bg-white py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  View on BaseScan
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
              <button
                onClick={handleClose}
                className="w-full border border-zinc-300 bg-white py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-4 text-center" role="alert" aria-live="assertive">
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-red-500">
              <AlertCircle className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <h2 id="mint-modal-title" className="text-base font-bold">That didn&apos;t work</h2>
            <p className="text-sm text-red-500">{error}</p>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 border border-zinc-300 bg-white py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setError(null);
                  resetMint();
                  setStep("preview");
                }}
                className="flex-1 bg-emerald-500 py-2.5 text-xs font-medium uppercase tracking-wide text-white"
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
