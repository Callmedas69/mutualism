"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useSendTransaction,
} from "wagmi";
import { parseEther, type Address } from "viem";
import Link from "next/link";
import { X, Check, Loader2, ExternalLink, Copy, AlertCircle } from "lucide-react";
import type { TokenizeGraphData, TokenizeStep } from "@/types/tokenize";
import { uploadImageToIPFS, uploadMetadataToIPFS, generateMetadata } from "@/lib/pinata";
import {
  prepareCoinCreation,
  generateSymbol,
  generateCoinName,
  getCoinUrl,
  parseCoinAddressFromReceipt,
  TOKENIZE_FEE,
  PLATFORM_WALLET,
  SYMBOL_SUFFIXES,
  type SymbolSuffix,
} from "@/lib/zora";
import { saveCreatedCoin } from "@/lib/storage";

interface TokenizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  getGraphBlob: () => Promise<Blob | null>;
  graphData: TokenizeGraphData;
}

// User-friendly error messages
function formatError(err: Error | string): string {
  const msg = typeof err === "string" ? err : err.message;

  // Common wallet errors
  if (msg.includes("rejected") || msg.includes("denied")) {
    return "Transaction was cancelled";
  }
  if (msg.includes("insufficient funds")) {
    return "Insufficient ETH balance";
  }

  // Network errors
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Please check your connection.";
  }

  // Keep it short
  if (msg.length > 100) {
    return msg.slice(0, 100) + "...";
  }

  return msg;
}

const STEPS: { id: TokenizeStep; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "payment", label: "Pay Fee" },
  { id: "uploading", label: "Upload" },
  { id: "creating", label: "Create" },
  { id: "success", label: "Done" },
];

export default function TokenizeModal({
  isOpen,
  onClose,
  getGraphBlob,
  graphData,
}: TokenizeModalProps) {
  const [step, setStep] = useState<TokenizeStep>("preview");
  const [error, setError] = useState<string | null>(null);
  const [coinAddress, setCoinAddress] = useState<Address | null>(null);
  const [coinUrl, setCoinUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedSuffix, setSelectedSuffix] = useState<SymbolSuffix>(SYMBOL_SUFFIXES[0]);

  // Generate coin name once (stable across re-renders)
  const [coinName] = useState(() =>
    generateCoinName(graphData.username, graphData.graphType)
  );

  const { address } = useAccount();

  // Fee payment transaction
  const {
    sendTransaction: sendFeeTx,
    data: feeHash,
    isPending: isFeePending,
    error: feeError,
    reset: resetFeeTx,
  } = useSendTransaction();

  // Wait for fee transaction
  const { isLoading: isFeeConfirming, isSuccess: isFeeConfirmed } =
    useWaitForTransactionReceipt({
      hash: feeHash,
    });

  // Coin creation transaction (using sendTransaction since Zora SDK returns raw tx params)
  const {
    sendTransaction: sendCoinTx,
    data: coinHash,
    isPending: isCoinPending,
    error: coinError,
    reset: resetCoinTx,
  } = useSendTransaction();

  // Wait for coin creation and get receipt
  const {
    isLoading: isCoinConfirming,
    isSuccess: isCoinConfirmed,
    data: coinReceipt,
  } = useWaitForTransactionReceipt({
    hash: coinHash,
  });

  // Generated symbol from username + selected suffix
  const coinSymbol = generateSymbol(graphData.username, selectedSuffix.label);

  // Handle fee payment
  const handlePayFee = useCallback(() => {
    if (!PLATFORM_WALLET) {
      setError("Platform wallet not configured");
      setStep("error");
      return;
    }

    setStep("payment");
    sendFeeTx({
      to: PLATFORM_WALLET,
      value: parseEther(TOKENIZE_FEE),
    });
  }, [sendFeeTx]);

  // Handle upload and create (defined before the useEffect that uses it)
  const handleUploadAndCreate = useCallback(async () => {
    if (!address) {
      setError("Wallet not connected");
      setStep("error");
      return;
    }

    try {
      setStep("uploading");

      // 1. Capture graph as blob
      const blob = await getGraphBlob();
      if (!blob) {
        throw new Error("Failed to capture graph image");
      }

      // 2. Upload image to IPFS
      const imageUri = await uploadImageToIPFS(
        blob,
        `${graphData.username}-graph.png`
      );

      // 3. Generate and upload metadata
      const metadata = generateMetadata(
        graphData.username,
        graphData.fid,
        graphData.graphType,
        graphData.nodeCount,
        imageUri
      );
      const metadataUri = await uploadMetadataToIPFS(metadata);

      // 4. Create coin on Zora
      setStep("creating");

      // Zora SDK returns raw tx params: { to, data, value }
      const txParams = await prepareCoinCreation({
        name: coinName,
        symbol: coinSymbol,
        uri: metadataUri,
        payoutRecipient: address,
      });

      // Send transaction using the raw params
      sendCoinTx({
        to: txParams.to,
        data: txParams.data,
        value: txParams.value,
      });
    } catch (err) {
      console.error("Tokenization error:", err);
      setError(formatError(err instanceof Error ? err : String(err)));
      setStep("error");
    }
  }, [address, getGraphBlob, graphData, coinName, coinSymbol, sendCoinTx]);

  // Trigger upload after fee confirmed
  useEffect(() => {
    if (isFeeConfirmed && step === "payment") {
      handleUploadAndCreate();
    }
  }, [isFeeConfirmed, step, handleUploadAndCreate]);

  // Handle coin creation success - parse coin address from receipt
  useEffect(() => {
    if (isCoinConfirmed && coinReceipt && coinHash) {
      // Parse coin address from transaction logs
      const coinAddr = parseCoinAddressFromReceipt(coinReceipt);

      if (coinAddr) {
        setCoinAddress(coinAddr);
        setCoinUrl(getCoinUrl(coinAddr));

        // Save to localStorage for gallery
        saveCreatedCoin({
          coinAddress: coinAddr,
          name: coinName,
          symbol: coinSymbol,
          username: graphData.username,
          fid: graphData.fid,
          graphType: graphData.graphType,
          nodeCount: graphData.nodeCount,
          createdAt: new Date().toISOString(),
          txHash: coinHash,
        });
      } else {
        // Fallback if parsing fails
        setCoinUrl(`https://zora.co/explore?search=${graphData.username}`);
      }
      setStep("success");
    }
  }, [isCoinConfirmed, coinReceipt, coinHash, graphData, coinName, coinSymbol]);

  // Handle wallet errors
  useEffect(() => {
    if (feeError) {
      setError(formatError(feeError));
      setStep("error");
    }
    if (coinError) {
      setError(formatError(coinError));
      setStep("error");
    }
  }, [feeError, coinError]);

  // Copy URL to clipboard
  const handleCopy = useCallback(() => {
    if (coinUrl) {
      navigator.clipboard.writeText(coinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [coinUrl]);

  // Reset state on close
  const handleClose = useCallback(() => {
    setStep("preview");
    setError(null);
    setCoinAddress(null);
    setCoinUrl(null);
    onClose();
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "payment" && step !== "uploading" && step !== "creating") {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleClose, step]);

  if (!isOpen) return null;

  // Progress indicator
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900">
        {/* Close button (disabled during processing) */}
        {step !== "payment" && step !== "uploading" && step !== "creating" && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={20} />
          </button>
        )}

        {/* Progress Steps */}
        <div className="mb-6 flex items-center justify-between">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium sm:h-8 sm:w-8 sm:text-xs ${
                  i < currentStepIndex
                    ? "bg-green-500 text-white"
                    : i === currentStepIndex
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
                }`}
              >
                {i < currentStepIndex ? <Check size={12} className="sm:h-3.5 sm:w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 2 && (
                <div
                  className={`hidden h-0.5 w-4 sm:block sm:w-8 ${
                    i < currentStepIndex
                      ? "bg-green-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Tokenize Your Graph</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Create a tradeable social token from your Farcaster graph snapshot.
            </p>

            {/* Token Name */}
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Token Name</p>
              <p className="font-medium text-zinc-900 dark:text-white">{coinName}</p>
            </div>

            {/* Symbol Suffix Selector */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose your token symbol
              </p>
              <div className="flex flex-wrap gap-2">
                {SYMBOL_SUFFIXES.map((suffix) => {
                  const previewSymbol = generateSymbol(graphData.username, suffix.label);
                  return (
                    <button
                      key={suffix.id}
                      onClick={() => setSelectedSuffix(suffix)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedSuffix.id === suffix.id
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      }`}
                    >
                      ${previewSymbol}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Graph Type</span>
                  <span className="font-medium">{graphData.graphType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Connections</span>
                  <span className="font-medium">{graphData.nodeCount}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <span className="text-zinc-500">Tokenization Fee</span>
                  <span className="font-medium">{TOKENIZE_FEE} ETH</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              You&apos;ll receive trading fees as the creator. The platform earns a small referral percentage.
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePayFee}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:from-purple-500 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                Tokenize
              </button>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === "payment" && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600" />
            <h2 className="text-xl font-bold">
              {isFeePending ? "Confirm in Wallet" : "Processing Payment"}
            </h2>
            <p className="text-sm text-zinc-500">
              {isFeePending
                ? `Approve the ${TOKENIZE_FEE} ETH tokenization fee`
                : "Waiting for transaction confirmation..."}
            </p>
          </div>
        )}

        {/* Uploading Step */}
        {step === "uploading" && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600" />
            <h2 className="text-xl font-bold">Uploading to IPFS</h2>
            <p className="text-sm text-zinc-500">
              Capturing your graph and uploading to IPFS...
            </p>
          </div>
        )}

        {/* Creating Step */}
        {step === "creating" && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-600" />
            <h2 className="text-xl font-bold">
              {isCoinPending ? "Confirm in Wallet" : "Creating Your Coin"}
            </h2>
            <p className="text-sm text-zinc-500">
              {isCoinPending
                ? "Approve the transaction to create your coin on Zora"
                : "Waiting for transaction confirmation..."}
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">Coin Created!</h2>
            <p className="text-sm text-zinc-500">
              Your social graph is now tokenized on Zora.
            </p>

            {/* Coin Details */}
            <div className="rounded-lg bg-zinc-50 p-4 text-left dark:bg-zinc-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Name</span>
                  <span className="font-medium">{coinName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Symbol</span>
                  <span className="font-mono font-medium">${coinSymbol}</span>
                </div>
                {coinAddress && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Contract</span>
                    <span className="font-mono text-xs">
                      {coinAddress.slice(0, 6)}...{coinAddress.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Shareable URL */}
            {coinUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                <input
                  type="text"
                  value={coinUrl}
                  readOnly
                  className="flex-1 truncate bg-transparent text-sm"
                />
                <button
                  onClick={handleCopy}
                  className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  title="Copy link"
                >
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <Link
                href="/gallery"
                onClick={handleClose}
                className="flex flex-1 items-center justify-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                View Gallery
              </Link>
              {coinUrl && (
                <a
                  href={coinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:from-purple-500 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                >
                  View on Zora
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Something Went Wrong</h2>
            <p className="text-sm text-red-500">{error}</p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setStep("preview");
                }}
                className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:from-purple-500 hover:to-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
