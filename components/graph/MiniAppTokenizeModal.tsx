"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useWriteContract,
} from "wagmi";
import { parseEther, type Address } from "viem";
import { X, Check, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import type { TokenizeGraphData, TokenizeStep } from "@/types/tokenize";
import type { SnapshotCache } from "@/hooks/useSnapshotCache";
import {
  prepareCoinCreation,
  generateSymbol,
  generateCoinName,
  getCoinUrl,
  parseCoinAddressFromReceipt,
  TOKENIZE_FEE,
  PLATFORM_WALLET,
} from "@/lib/zora";
import { REGISTRY_ADDRESS, REGISTRY_ABI, requestRegistrySignature } from "@/lib/registry";
import { useMiniAppContext } from "@/context/MiniAppProvider";
import { formatTransactionErrorShort } from "@/lib/errors";

interface MiniAppTokenizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ensureSnapshot: () => Promise<SnapshotCache>;
  graphData: TokenizeGraphData;
}

// Simplified steps for miniapp UI
const STEPS: { id: TokenizeStep; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "payment", label: "Pay" },
  { id: "creating", label: "Create" },
  { id: "success", label: "Done" },
];

export default function MiniAppTokenizeModal({
  isOpen,
  onClose,
  ensureSnapshot,
  graphData,
}: MiniAppTokenizeModalProps) {
  const [step, setStep] = useState<TokenizeStep>("preview");
  const [error, setError] = useState<string | null>(null);
  const [coinAddress, setCoinAddress] = useState<Address | null>(null);
  const [coinUrl, setCoinUrl] = useState<string | null>(null);
  const [registryFailed, setRegistryFailed] = useState(false);
  const [feePaid, setFeePaid] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const { composeCast, openUrl } = useMiniAppContext();

  // Generate coin name and symbol once
  const [coinName] = useState(() =>
    generateCoinName(graphData.username, graphData.graphType)
  );
  const [coinSymbol] = useState(() =>
    generateSymbol(graphData.username, graphData.graphType)
  );

  const { address } = useAccount();

  // Fee payment transaction
  const {
    sendTransaction: sendFeeTx,
    data: feeHash,
    isPending: isFeePending,
    error: feeError,
  } = useSendTransaction();

  const { isSuccess: isFeeConfirmed } = useWaitForTransactionReceipt({
    hash: feeHash,
  });

  // Coin creation transaction
  const {
    sendTransaction: sendCoinTx,
    data: coinHash,
    isPending: isCoinPending,
    error: coinError,
  } = useSendTransaction();

  const {
    isSuccess: isCoinConfirmed,
    data: coinReceipt,
  } = useWaitForTransactionReceipt({
    hash: coinHash,
  });

  // Registry contract call
  const {
    writeContract: registerCoin,
    data: registryHash,
    isPending: isRegistryPending,
    error: registryError,
  } = useWriteContract();

  const { isSuccess: isRegistryConfirmed } = useWaitForTransactionReceipt({
    hash: registryHash,
  });

  // Handle fee payment
  const handlePayFee = useCallback(() => {
    if (!PLATFORM_WALLET) {
      setError("Platform not configured");
      setStep("error");
      return;
    }

    setStep("payment");
    sendFeeTx({
      to: PLATFORM_WALLET,
      value: parseEther(TOKENIZE_FEE),
    });
  }, [sendFeeTx]);

  // Handle upload and create
  const handleUploadAndCreate = useCallback(async () => {
    if (!address) {
      setError("Wallet not connected");
      setStep("error");
      return;
    }

    try {
      setStep("uploading");

      // Use cached snapshot or upload new one
      const snapshotResult = await ensureSnapshot();

      setStep("creating");

      const txParams = await prepareCoinCreation({
        name: coinName,
        symbol: coinSymbol,
        uri: snapshotResult.metadataUri,
        payoutRecipient: address,
      });

      sendCoinTx({
        to: txParams.to,
        data: txParams.data,
        value: txParams.value,
      });
    } catch (err) {
      console.error("Tokenization error:", err);
      setError(formatTransactionErrorShort(err instanceof Error ? err : String(err)));
      setStep("error");
    }
  }, [address, ensureSnapshot, coinName, coinSymbol, sendCoinTx]);

  // Trigger upload after fee confirmed
  useEffect(() => {
    if (isFeeConfirmed && step === "payment") {
      setFeePaid(true);
      handleUploadAndCreate();
    }
  }, [isFeeConfirmed, step, handleUploadAndCreate]);

  // Handle coin creation success
  useEffect(() => {
    if (isCoinConfirmed && coinReceipt && coinHash && step === "creating") {
      const coinAddr = parseCoinAddressFromReceipt(coinReceipt);

      if (coinAddr) {
        setCoinAddress(coinAddr);
        setCoinUrl(getCoinUrl(coinAddr));

        if (REGISTRY_ADDRESS && address) {
          setStep("registering");
          (async () => {
            const signature = await requestRegistrySignature(address, coinAddr);

            if (signature) {
              registerCoin({
                address: REGISTRY_ADDRESS,
                abi: REGISTRY_ABI,
                functionName: "registerCoin",
                args: [coinAddr, signature],
              });
            } else {
              setStep("success");
            }
          })();
        } else {
          setStep("success");
        }
      } else {
        setCoinUrl(`https://zora.co/explore?search=${graphData.username}`);
        setStep("success");
      }
    }
  }, [isCoinConfirmed, coinReceipt, coinHash, step, graphData, registerCoin, address]);

  // Handle registry success
  useEffect(() => {
    if (isRegistryConfirmed && step === "registering") {
      setStep("success");
    }
  }, [isRegistryConfirmed, step]);

  // Handle wallet errors
  useEffect(() => {
    if (feeError) {
      setError(formatTransactionErrorShort(feeError));
      setStep("error");
    }
    if (coinError) {
      setError(formatTransactionErrorShort(coinError));
      setStep("error");
    }
    if (registryError) {
      setRegistryFailed(true);
      setStep("success");
    }
  }, [feeError, coinError, registryError]);

  // Share to Farcaster
  const handleShare = useCallback(() => {
    if (coinUrl) {
      composeCast(
        `I just posted my ${graphData.graphType} graph to Zora via @mutualism`,
        [coinUrl]
      );
    }
  }, [coinUrl, graphData.graphType, composeCast]);

  // Open on Zora
  const handleViewOnZora = useCallback(() => {
    if (coinUrl) {
      openUrl(coinUrl);
    }
  }, [coinUrl, openUrl]);

  // Reset state on close
  const handleClose = useCallback(() => {
    setStep("preview");
    setError(null);
    setCoinAddress(null);
    setCoinUrl(null);
    setRegistryFailed(false);
    setFeePaid(false);
    onClose();
  }, [onClose]);

  // Close on escape
  const handleCloseRef = useRef(handleClose);
  const stepRef = useRef(step);
  handleCloseRef.current = handleClose;
  stepRef.current = step;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      const currentStep = stepRef.current;
      const blockedSteps = ["payment", "uploading", "creating", "registering"];
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

    // Focus first focusable element
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

  const currentStepIndex = STEPS.findIndex((s) => s.id === step ||
    (s.id === "creating" && (step === "uploading" || step === "registering")));

  const isProcessing = ["payment", "uploading", "creating", "registering"].includes(step);

  // Helper for contextual error titles (casual)
  const getErrorTitle = () => {
    if (feeError) return "Payment didn't go through";
    if (coinError) return "Couldn't create your coin";
    return "Something went wrong";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-modal-title"
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

        {/* Simplified Progress */}
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
                    ? "bg-[#f25b28] text-white"
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
            <h2 id="post-modal-title" className="text-center text-base font-bold">Post to Zora</h2>

            <div className="space-y-2">
              <div className="flex justify-between bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
                <span className="text-zinc-500">Name</span>
                <span className="font-medium">{coinName}</span>
              </div>
              <div className="flex justify-between bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
                <span className="text-zinc-500">Symbol</span>
                <span className="font-mono font-medium">${coinSymbol}</span>
              </div>
              <div className="flex justify-between bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
                <span className="text-zinc-500">Fee</span>
                <span className="font-medium">{TOKENIZE_FEE} ETH</span>
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
                onClick={handlePayFee}
                className="flex-1 bg-[#f25b28] py-2.5 text-xs font-medium uppercase tracking-wide text-white"
              >
                Post to Zora
              </button>
            </div>
          </div>
        )}

        {/* Processing Steps */}
        {isProcessing && (
          <div className="space-y-4 py-4 text-center" role="status" aria-live="polite">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#f25b28]" aria-hidden="true" />
            <h2 id="post-modal-title" className="text-base font-bold">
              {step === "payment" && (isFeePending ? "Approve in your wallet" : "Sending...")}
              {step === "uploading" && "Saving your graph..."}
              {step === "creating" && (isCoinPending ? "One more approval" : "Minting...")}
              {step === "registering" && (isRegistryPending ? "Last one, promise!" : "Finishing up...")}
            </h2>
            <p className="text-xs text-zinc-500">
              {step === "payment" && "Small fee to cover costs"}
              {step === "uploading" && "Almost ready..."}
              {step === "creating" && "Making it official..."}
              {step === "registering" && "Adding to the gallery..."}
            </p>
            {/* Transaction hash display */}
            {(feeHash && step === "payment") && (
              <p className="font-mono text-xs text-zinc-400">
                Tx: {feeHash.slice(0, 8)}...{feeHash.slice(-6)}
              </p>
            )}
            {(coinHash && (step === "creating" || step === "registering")) && (
              <p className="font-mono text-xs text-zinc-400">
                Tx: {coinHash.slice(0, 8)}...{coinHash.slice(-6)}
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
              <h2 id="post-modal-title" className="text-lg font-bold">
                {registryFailed ? "Coin Created!" : "You did it!"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {registryFailed ? "Your coin is live on Zora" : "Your graph is live on Zora!"}
              </p>
            </div>

            {coinAddress && (
              <p className="font-mono text-xs text-zinc-500">
                {coinAddress.slice(0, 8)}...{coinAddress.slice(-6)}
              </p>
            )}

            {/* Registry failure warning */}
            {registryFailed && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 p-3 text-left dark:bg-amber-900/20 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Your coin is live but won&apos;t show in the gallery yet.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleShare}
                className="w-full bg-[#8B5CF6] py-2.5 text-xs font-medium uppercase tracking-wide text-white"
              >
                Share on Farcaster
              </button>
              <button
                onClick={handleViewOnZora}
                className="flex w-full items-center justify-center gap-1 bg-[#f25b28] py-2.5 text-xs font-medium uppercase tracking-wide text-white"
              >
                View on Zora
                <ExternalLink size={12} aria-hidden="true" />
              </button>
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
            <h2 id="post-modal-title" className="text-base font-bold">{getErrorTitle()}</h2>
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
                  if (feePaid) {
                    // Resume from upload if already paid
                    handleUploadAndCreate();
                  } else {
                    setStep("preview");
                  }
                }}
                className="flex-1 bg-[#f25b28] py-2.5 text-xs font-medium uppercase tracking-wide text-white"
              >
                {feePaid ? "Try again (no extra fee)" : "Try again"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
