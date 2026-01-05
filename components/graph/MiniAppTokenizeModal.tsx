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
import { useMiniAppContext } from "@/context/MiniAppProvider";
import { formatTransactionErrorShort } from "@/lib/errors";

interface MiniAppTokenizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  getGraphBlob: () => Promise<Blob | null>;
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
  getGraphBlob,
  graphData,
}: MiniAppTokenizeModalProps) {
  const [step, setStep] = useState<TokenizeStep>("preview");
  const [error, setError] = useState<string | null>(null);
  const [coinAddress, setCoinAddress] = useState<Address | null>(null);
  const [coinUrl, setCoinUrl] = useState<string | null>(null);

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

      const blob = await getGraphBlob();
      if (!blob) {
        throw new Error("Failed to capture graph");
      }

      const { ipfsUri: imageUri } = await uploadImageToIPFS(
        blob,
        `${graphData.username}-graph.png`
      );

      const metadata = generateMetadata(
        graphData.username,
        graphData.fid,
        graphData.graphType,
        graphData.nodeCount,
        imageUri
      );
      const metadataUri = await uploadMetadataToIPFS(metadata);

      setStep("creating");

      const txParams = await prepareCoinCreation({
        name: coinName,
        symbol: coinSymbol,
        uri: metadataUri,
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
  }, [address, getGraphBlob, graphData, coinName, coinSymbol, sendCoinTx]);

  // Trigger upload after fee confirmed
  useEffect(() => {
    if (isFeeConfirmed && step === "payment") {
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
      setStep("success");
    }
  }, [feeError, coinError, registryError]);

  // Share to Farcaster
  const handleShare = useCallback(() => {
    if (coinUrl) {
      composeCast(
        `I just tokenized my ${graphData.graphType} graph on @mutualism`,
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

  if (!isOpen) return null;

  const currentStepIndex = STEPS.findIndex((s) => s.id === step ||
    (s.id === "creating" && (step === "uploading" || step === "registering")));

  const isProcessing = ["payment", "uploading", "creating", "registering"].includes(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Close button */}
        {!isProcessing && (
          <button
            onClick={handleClose}
            className="absolute right-3 top-3 z-10 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            <X size={18} />
          </button>
        )}

        {/* Simplified Progress */}
        <div className="mb-5 flex items-center justify-center gap-2">
          {STEPS.slice(0, -1).map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center text-[10px] font-bold ${
                  i < currentStepIndex
                    ? "bg-green-500 text-white"
                    : i === currentStepIndex
                    ? "bg-[#f25b28] text-white"
                    : "bg-zinc-200 text-zinc-500 dark:bg-zinc-700"
                }`}
              >
                {i < currentStepIndex ? <Check size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 2 && (
                <div className={`h-px w-6 ${i < currentStepIndex ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            <h2 className="text-center text-base font-bold">Tokenize Graph</h2>

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
                Tokenize
              </button>
            </div>
          </div>
        )}

        {/* Processing Steps */}
        {isProcessing && (
          <div className="space-y-4 py-4 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#f25b28]" />
            <h2 className="text-base font-bold">
              {step === "payment" && (isFeePending ? "Confirm in wallet" : "Processing...")}
              {step === "uploading" && "Uploading..."}
              {step === "creating" && (isCoinPending ? "Confirm in wallet" : "Creating...")}
              {step === "registering" && (isRegistryPending ? "One more..." : "Registering...")}
            </h2>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-green-500">
              <Check className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-base font-bold">Live on Zora!</h2>

            {coinAddress && (
              <p className="font-mono text-xs text-zinc-500">
                {coinAddress.slice(0, 8)}...{coinAddress.slice(-6)}
              </p>
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
                <ExternalLink size={12} />
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
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center bg-red-500">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-base font-bold">Failed</h2>
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
                  setStep("preview");
                }}
                className="flex-1 bg-[#f25b28] py-2.5 text-xs font-medium uppercase tracking-wide text-white"
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
