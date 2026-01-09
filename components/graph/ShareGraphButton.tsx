"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import type { SnapshotCache } from "@/hooks/useSnapshotCache";

// App URL for embed (allows users to click through to the app)
const APP_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://mutualism.geoart.studio";

type ShareState = "idle" | "uploading" | "sharing" | "verifying" | "success" | "timeout" | "error";

interface ShareGraphButtonProps {
  graphType: string;
  ensureSnapshot: () => Promise<SnapshotCache>;
  composeCast: (text?: string, embeds?: string[]) => Promise<void>;
  disabled?: boolean;
  isUploading?: boolean;
  userFid?: number;
  onShareVerified?: (castHash: string) => void;
}

export default function ShareGraphButton({
  graphType,
  ensureSnapshot,
  composeCast,
  disabled = false,
  isUploading = false,
  userFid,
  onShareVerified,
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
    } catch (err) {
      console.error("Failed to compose cast:", err);
      setError("Failed to open share");
      setState("error");
      return;
    }

    // Step 3: Verify cast was published via Neynar (if userFid provided)
    if (userFid && onShareVerified) {
      setState("verifying");

      const searchText = "mutualism";
      const maxAttempts = 20; // 20 attempts * 3s = 60s max

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, 3000)); // Wait 3s

        try {
          const res = await fetch("/api/farcaster/verify-cast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fid: userFid,
              searchText,
              imageUrl,
              maxAgeSeconds: 120,
            }),
          });

          const data = await res.json();

          if (data.verified) {
            setState("success");
            onShareVerified(data.castHash);
            return;
          }
        } catch (err) {
          console.error("Verification poll error:", err);
        }
      }

      // Timeout - couldn't verify
      setState("timeout");
      setError("Cast not found. Did you post it?");
    } else {
      // No verification needed - just show success
      setState("success");
      setTimeout(() => setState("idle"), 1500);
    }
  };

  const handleRetry = () => {
    setState("idle");
    setError(null);
  };

  // Error/timeout state with retry
  if (state === "error" || state === "timeout") {
    return (
      <button
        onClick={handleRetry}
        className="flex items-center gap-2 border border-red-400 bg-red-50 px-3 py-2.5 min-h-[44px] text-[10px] uppercase tracking-[0.1em] font-medium text-red-600 transition-all duration-200 hover:border-red-600 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:border-red-700 dark:bg-red-950 dark:text-red-400 dark:hover:border-red-500"
      >
        <Share2 size={14} />
        {state === "timeout" ? "Try Again" : error || "Error"}
      </button>
    );
  }

  const buttonText = {
    idle: "Share",
    uploading: "Saving...",
    sharing: "Opening...",
    verifying: "Verifying...",
    success: "Verified!",
    timeout: "Try Again",
    error: "Error",
  }[state];

  const isSuccess = state === "success";
  const isVerifying = state === "verifying";

  return (
    <button
      onClick={handleShare}
      disabled={disabled || state !== "idle" || isUploading}
      aria-busy={state === "uploading" || state === "verifying" || isUploading}
      className={`flex items-center gap-2 border px-3 py-2.5 min-h-[44px] text-[10px] uppercase tracking-[0.1em] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        isSuccess
          ? "border-green-500 bg-green-50 text-green-600 dark:border-green-600 dark:bg-green-950 dark:text-green-400"
          : isVerifying
          ? "border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-400"
          : "border-zinc-300 bg-zinc-100 text-zinc-600 hover:border-zinc-900 hover:bg-zinc-200 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
      }`}
    >
      {isSuccess ? <Check size={14} /> : <Share2 size={14} />}
      {buttonText}
    </button>
  );
}
