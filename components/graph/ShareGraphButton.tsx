"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import type { SnapshotCache } from "@/hooks/useSnapshotCache";

// App URL for embed (allows users to click through to the app)
const APP_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://mutualism.geoart.studio";

type ShareState = "idle" | "uploading" | "sharing" | "success" | "error";

interface ShareGraphButtonProps {
  graphType: string;
  ensureSnapshot: () => Promise<SnapshotCache>;
  composeCast: (text?: string, embeds?: string[]) => Promise<void>;
  disabled?: boolean;
  isUploading?: boolean;
}

export default function ShareGraphButton({
  graphType,
  ensureSnapshot,
  composeCast,
  disabled = false,
  isUploading = false,
}: ShareGraphButtonProps) {
  const [state, setState] = useState<ShareState>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (state !== "idle" || isUploading) return;
    setError(null);

    // Step 1: Ensure snapshot exists (uses cache if available)
    setState("uploading");
    let imageUrl: string;
    try {
      const result = await ensureSnapshot();

      // Use folder gateway URL + image.png for Farcaster embed
      imageUrl = `${result.gatewayUrl}/image.png`;

      if (!result.gatewayUrl) {
        throw new Error("No gateway URL returned");
      }
    } catch (err) {
      console.error("Failed to create snapshot:", err);
      setError(err instanceof Error ? err.message : "Failed to save snapshot");
      setState("error");
      return;
    }

    // Step 2: Open composeCast with image + app URL embeds
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
        className="flex items-center gap-2 border border-red-400 bg-red-50 px-3 py-2.5 min-h-[44px] text-[10px] uppercase tracking-[0.1em] font-medium text-red-600 transition-all duration-200 hover:border-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:border-red-500"
      >
        <Share2 size={14} />
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
      disabled={disabled || state !== "idle" || isUploading}
      aria-busy={state === "uploading" || isUploading}
      className={`flex items-center gap-2 border px-3 py-2.5 min-h-[44px] text-[10px] uppercase tracking-[0.1em] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        isSuccess
          ? "border-green-500 bg-green-50 text-green-600 dark:border-green-600 dark:bg-green-950 dark:text-green-400"
          : "border-zinc-300 bg-zinc-100 text-zinc-600 hover:border-zinc-900 hover:bg-zinc-200 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
      }`}
    >
      <Share2 size={14} />
      {buttonText}
    </button>
  );
}
