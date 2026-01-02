"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

interface ShareGraphButtonProps {
  graphType: string;
  composeCast: (text?: string, embeds?: string[]) => Promise<void>;
  disabled?: boolean;
}

// App URL for embed
const APP_URL = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://mutualism.geoart.studio";

export default function ShareGraphButton({
  graphType,
  composeCast,
  disabled = false,
}: ShareGraphButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      await composeCast(
        `My ${graphType} graph on MUTUALISM`,
        [APP_URL]
      );
    } catch (error) {
      console.error("Share failed:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={disabled || isSharing}
      className="flex items-center gap-2 border border-zinc-300 bg-white px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-medium text-zinc-600 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
    >
      <Share2 size={12} />
      {isSharing ? "Opening..." : "Share"}
    </button>
  );
}
