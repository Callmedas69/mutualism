"use client";

import { useState } from "react";
import { ExternalLink, AlertCircle } from "lucide-react";

type ShareState = "idle" | "uploading" | "opening" | "error";

interface ShareGraphButtonProps {
  getGraphBlob: () => Promise<Blob | null>;
  username: string;
  openUrl: (url: string) => Promise<void>;
  disabled?: boolean;
}

export default function ShareGraphButton({
  getGraphBlob,
  username,
  openUrl,
  disabled = false,
}: ShareGraphButtonProps) {
  const [state, setState] = useState<ShareState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleShare = async () => {
    if (state !== "idle" && state !== "error") return;

    setState("uploading");
    setErrorMessage(null);

    try {
      // Generate graph image
      const blob = await getGraphBlob();
      if (!blob) {
        throw new Error("Failed to generate image");
      }

      // Upload to IPFS via existing API
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `${username}-graph-${timestamp}.png`;

      const formData = new FormData();
      formData.append("file", blob, filename);

      const response = await fetch("/api/tokenize", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await response.json();
      // API returns gatewayUrl with server-side PINATA_GATEWAY
      const gatewayUrl: string = data.gatewayUrl;

      // Open in external browser
      setState("opening");
      await openUrl(gatewayUrl);

      // Reset to idle after successful open
      setState("idle");
    } catch (error) {
      // Log for developers
      console.error("Share failed:", error);

      // Show user-friendly message
      setState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    }
  };

  // Clear error on retry
  const handleClick = () => {
    if (state === "error") {
      setErrorMessage(null);
    }
    handleShare();
  };

  const getButtonContent = () => {
    switch (state) {
      case "uploading":
        return "Uploading...";
      case "opening":
        return "Opening...";
      case "error":
        return "Retry";
      default:
        return "Open Image";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={disabled || state === "uploading" || state === "opening"}
        className={`flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
          state === "error"
            ? "border-red-300 bg-red-50 text-red-600 hover:border-red-500 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
            : "border-zinc-300 bg-white text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
        }`}
      >
        {state === "error" ? <AlertCircle size={12} /> : <ExternalLink size={12} />}
        {getButtonContent()}
      </button>

      {/* Error message for user */}
      {errorMessage && (
        <span className="text-[10px] text-red-500 dark:text-red-400">
          {errorMessage}
        </span>
      )}
    </div>
  );
}
