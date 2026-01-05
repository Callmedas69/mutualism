"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useWriteContract,
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
} from "@/lib/zora";
import { REGISTRY_ADDRESS, REGISTRY_ABI, requestRegistrySignature } from "@/lib/registry";
import { useEthPrice, calculateUsdValue } from "@/hooks/useEthPrice";
import { formatTransactionError } from "@/lib/errors";

interface TokenizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  getGraphBlob: () => Promise<Blob | null>;
  graphData: TokenizeGraphData;
}

const STEPS: { id: TokenizeStep; label: string }[] = [
  { id: "preview", label: "Preview" },
  { id: "payment", label: "Pay Fee" },
  { id: "uploading", label: "Upload" },
  { id: "creating", label: "Create" },
  { id: "registering", label: "Register" },
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

  // Generate coin name and symbol once (stable across re-renders)
  const [coinName] = useState(() =>
    generateCoinName(graphData.username, graphData.graphType)
  );
  const [coinSymbol] = useState(() =>
    generateSymbol(graphData.username, graphData.graphType)
  );

  const { address } = useAccount();
  const ethPrice = useEthPrice();
  const feeInUsd = calculateUsdValue(TOKENIZE_FEE, ethPrice);

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

  // Registry contract call
  const {
    writeContract: registerCoin,
    data: registryHash,
    isPending: isRegistryPending,
    error: registryError,
  } = useWriteContract();

  // Wait for registry transaction
  const { isLoading: isRegistryConfirming, isSuccess: isRegistryConfirmed } =
    useWaitForTransactionReceipt({
      hash: registryHash,
    });

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
      const { ipfsUri: imageUri } = await uploadImageToIPFS(
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
      setError(formatTransactionError(err instanceof Error ? err : String(err)));
      setStep("error");
    }
  }, [address, getGraphBlob, graphData, coinName, coinSymbol, sendCoinTx]);

  // Trigger upload after fee confirmed
  useEffect(() => {
    if (isFeeConfirmed && step === "payment") {
      handleUploadAndCreate();
    }
  }, [isFeeConfirmed, step, handleUploadAndCreate]);

  // Handle coin creation success - parse coin address and trigger registry
  useEffect(() => {
    if (isCoinConfirmed && coinReceipt && coinHash && step === "creating") {
      // Parse coin address from transaction logs
      const coinAddr = parseCoinAddressFromReceipt(coinReceipt);

      if (coinAddr) {
        setCoinAddress(coinAddr);
        setCoinUrl(getCoinUrl(coinAddr));

        // Register coin on-chain
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
              setError("Failed to register coin. You can still view it on Zora.");
              setStep("success");
            }
          })();
        } else {
          // No registry configured, go straight to success
          setStep("success");
        }
      } else {
        // Fallback if parsing fails
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
      setError(formatTransactionError(feeError));
      setStep("error");
    }
    if (coinError) {
      setError(formatTransactionError(coinError));
      setStep("error");
    }
    if (registryError) {
      // Registry failed but coin was created - show warning but continue
      console.error("Registry error:", registryError);
      setError("Coin created but failed to register. It may not appear in your gallery.");
      setStep("success");
    }
  }, [feeError, coinError, registryError]);

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

  // Stable refs for escape handler to avoid re-adding listener
  const handleCloseRef = useRef(handleClose);
  const stepRef = useRef(step);
  handleCloseRef.current = handleClose;
  stepRef.current = step;

  // Close on escape key - listener added once
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

  if (!isOpen) return null;

  // Progress indicator
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Close button (disabled during processing) */}
        {step !== "payment" && step !== "uploading" && step !== "creating" && step !== "registering" && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={20} />
          </button>
        )}

        {/* Progress Steps */}
        <div className="mb-6 flex items-center justify-between pr-8">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex h-6 w-6 items-center justify-center border text-[10px] font-medium sm:h-8 sm:w-8 sm:text-xs ${
                  i < currentStepIndex
                    ? "border-green-500 bg-green-500 text-white"
                    : i === currentStepIndex
                    ? "border-[#f25b28] bg-[#f25b28] text-white"
                    : "border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                }`}
              >
                {i < currentStepIndex ? <Check size={12} className="sm:h-3.5 sm:w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 2 && (
                <div
                  className={`hidden h-px w-4 sm:block sm:w-8 ${
                    i < currentStepIndex
                      ? "bg-green-500"
                      : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-lg font-bold py-3">
              Turn your social graph into a tradeable coin.
            </p>

            {/* Token Name */}
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Token Name</p>
              <p className="font-medium text-zinc-900 dark:text-white">{coinName}</p>
            </div>

            {/* Token Symbol */}
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Token Symbol</p>
              <p className="font-mono font-medium text-zinc-900 dark:text-white">${coinSymbol}</p>
            </div>

            {/* Details */}
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Graph Type</span>
                  <span className="font-medium">{graphData.graphType}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-2 dark:border-zinc-700">
                  <span className="text-zinc-500">Deployment Fee</span>
                  <span className="font-medium">
                    {TOKENIZE_FEE} ETH{feeInUsd && ` (~$${feeInUsd})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleClose}
                className="flex-1 border border-zinc-300 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-400"
              >
                Cancel
              </button>
              <button
                onClick={handlePayFee}
                className="flex-1 border border-[#f25b28] bg-[#f25b28] px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:border-[#d94f22] hover:bg-[#d94f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] focus-visible:ring-offset-2"
              >
                Tokenize
              </button>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === "payment" && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#f25b28]" />
            <h2 className="text-xl font-bold">
              {isFeePending ? "Check your wallet" : "Sending fee..."}
            </h2>
            <p className="text-sm text-zinc-500">
              {isFeePending
                ? `Approve ${TOKENIZE_FEE} ETH${feeInUsd ? ` (~$${feeInUsd})` : ""} to continue`
                : "Hang tight, confirming..."}
            </p>
          </div>
        )}

        {/* Uploading Step */}
        {step === "uploading" && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#f25b28]" />
            <h2 className="text-xl font-bold">Preparing your coin</h2>
            <p className="text-sm text-zinc-500">
              Capturing your graph...
            </p>
          </div>
        )}

        {/* Creating Step */}
        {step === "creating" && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#f25b28]" />
            <h2 className="text-xl font-bold">
              {isCoinPending ? "Check your wallet" : "Minting your coin..."}
            </h2>
            <p className="text-sm text-zinc-500">
              {isCoinPending
                ? "Approve to deploy on Zora"
                : "Almost there..."}
            </p>
          </div>
        )}

        {/* Registering Step */}
        {step === "registering" && (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#f25b28]" />
            <h2 className="text-xl font-bold">
              {isRegistryPending ? "One more signature" : "Adding to gallery..."}
            </h2>
            <p className="text-sm text-zinc-500">
              {isRegistryPending
                ? "Approve to save your coin"
                : "Wrapping up..."}
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-green-500 bg-green-50 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">You're live!</h2>
            <p className="text-sm text-zinc-500">
              Your coin is ready to trade on Zora.
            </p>

            {/* Warning if registry failed */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-left dark:bg-amber-900/20">
                <AlertCircle size={16} className="shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{error}</p>
              </div>
            )}

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
              <div className="flex items-center gap-2 border border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-800">
                <input
                  type="text"
                  value={coinUrl}
                  readOnly
                  className="flex-1 truncate bg-transparent font-mono text-xs"
                />
                <button
                  onClick={handleCopy}
                  className="border border-zinc-300 p-1.5 transition-colors hover:border-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:hover:border-zinc-400 dark:hover:bg-zinc-700"
                  title="Copy link"
                >
                  {copied ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <Link
                href="/gallery"
                onClick={handleClose}
                className="flex flex-1 items-center justify-center border border-zinc-300 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-400"
              >
                View Gallery
              </Link>
              {coinUrl && (
                <a
                  href={coinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 border border-[#f25b28] bg-[#f25b28] px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:border-[#d94f22] hover:bg-[#d94f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] focus-visible:ring-offset-2"
                >
                  View on Zora
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-red-500 bg-red-50 dark:bg-red-900/30">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold">Something Went Wrong</h2>
            <p className="text-sm text-red-500">{error}</p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={handleClose}
                className="flex-1 border border-zinc-300 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-400"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setError(null);
                  setStep("preview");
                }}
                className="flex-1 border border-[#f25b28] bg-[#f25b28] px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:border-[#d94f22] hover:bg-[#d94f22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f25b28] focus-visible:ring-offset-2"
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
