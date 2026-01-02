"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { uploadImageToIPFS } from "@/lib/pinata";

type ShareState = "idle" | "uploading" | "sharing" | "success" | "error";

interface ShareGraphButtonProps {
  graphType: string;
  username: string;
  getGraphBlob: () => Promise<Blob | null>;
  composeCast: (text?: string, embeds?: string[]) => Promise<void>;
  disabled?: boolean;
}

export default function ShareGraphButton({
  graphType,
  username,
  getGraphBlob,
  composeCast,
  disabled = false,
}: ShareGraphButtonProps) {
  const [state, setState] = useState<ShareState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (state !== "idle") return;
    setError(null);

    // Step 1: Generate PNG
    setState("uploading");
    let blob: Blob | null = null;
    try {
      blob = await getGraphBlob();
      if (!blob) {
        throw new Error("Failed to generate graph image");
      }
    } catch (err) {
      console.error("Failed to generate PNG:", err);
      setError("Failed to generate image");
      setState("error");
      return;
    }

    // Step 2: Upload to Pinata
    let gatewayUrl: string;
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${username}-${graphType.toLowerCase()}-${timestamp}.png`;
      const result = await uploadImageToIPFS(blob, filename);
      gatewayUrl = result.gatewayUrl;

      if (!gatewayUrl) {
        throw new Error("No gateway URL returned");
      }
    } catch (err) {
      console.error("Failed to upload to IPFS:", err);
      setError("Failed to upload image");
      setState("error");
      return;
    }

    // Step 3: Open composeCast with image embed
    setState("sharing");
    try {
      await composeCast(
        `My ${graphType} graph on MUTUALISM`,
        [gatewayUrl]
      );
      // Show success feedback before returning to idle
      setState("success");
      setTimeout(() => setState("idle"), 1500);
    } catch (err) {
      console.error("Failed to compose cast:", err);
      setError("Failed to open share");
      setState("error");
    }
  };

  const handleRetry = () => {
    setState("idle");
    setError(null);
  };

  // Error state with retry
  if (state === "error") {
    return (
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 border border-red-400 bg-red-50 px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-medium text-red-600 transition-all duration-200 hover:border-red-600 hover:bg-red-100 dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:border-red-500"
      >
        <Share2 size={12} />
        {error || "Error"} - Retry
      </button>
    );
  }

  const buttonText = {
    idle: "Share",
    uploading: "Uploading...",
    sharing: "Opening...",
    success: "Shared!",
    error: "Error",
  }[state];

  const isSuccess = state === "success";

  return (
    <button
      onClick={handleShare}
      disabled={disabled || state !== "idle"}
      className={`flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        isSuccess
          ? "border-green-500 bg-green-50 text-green-600 dark:border-green-600 dark:bg-green-950 dark:text-green-400"
          : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
      }`}
    >
      <Share2 size={12} />
      {buttonText}
    </button>
  );
}
