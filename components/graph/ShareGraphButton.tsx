"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { uploadSnapshot, mapGraphTypeToView } from "@/lib/pinata";

// App URL for embed (allows users to click through to the app)
const APP_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://mutualism.geoart.studio";

type ShareState = "idle" | "uploading" | "sharing" | "success" | "error";

interface ShareGraphButtonProps {
  graphType: string;
  username: string;
  fid: number;
  getGraphBlob: () => Promise<Blob | null>;
  composeCast: (text?: string, embeds?: string[]) => Promise<void>;
  disabled?: boolean;
}

export default function ShareGraphButton({
  graphType,
  username,
  fid,
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

    // Step 2: Create snapshot (folder + DB record)
    let imageUrl: string;
    try {
      const view = mapGraphTypeToView(graphType);
      const result = await uploadSnapshot({
        imageBlob: blob,
        fid,
        username,
        view,
        timeWindow: "all_time",
      });

      // Use folder gateway URL + image.png for Farcaster embed
      imageUrl = `${result.gatewayUrl}/image.png`;

      if (!result.gatewayUrl) {
        throw new Error("No gateway URL returned");
      }
    } catch (err) {
      console.error("Failed to create snapshot:", err);
      setError("Failed to save snapshot");
      setState("error");
      return;
    }

    // Step 3: Open composeCast with image + app URL embeds
    setState("sharing");
    try {
      await composeCast(
        `My ${graphType} graph on MUTUALISM`,
        [imageUrl, APP_URL]
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
        className="flex items-center gap-1.5 border border-red-400 bg-red-50 px-2 py-1.5 text-[9px] uppercase tracking-[0.1em] font-medium text-red-600 transition-all duration-200 hover:border-red-600 hover:bg-red-100 sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px] dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:border-red-500"
      >
        <Share2 size={12} />
        {error || "Error"} - Retry
      </button>
    );
  }

  const buttonText = {
    idle: "Share",
    uploading: "Saving...",
    sharing: "Opening...",
    success: "Shared!",
    error: "Error",
  }[state];

  const isSuccess = state === "success";

  return (
    <button
      onClick={handleShare}
      disabled={disabled || state !== "idle"}
      className={`flex items-center gap-1.5 border px-2 py-1.5 text-[9px] uppercase tracking-[0.1em] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px] ${
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
