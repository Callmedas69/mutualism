"use client";

import { useState } from "react";
import { useMiniAppContext } from "@/context/MiniAppProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

/**
 * Modal prompting users to add the miniapp to their Farcaster client
 * Shows on every visit until the app is added
 */
export default function AddAppModal() {
  const { isMiniApp, isAppAdded, platform, addMiniApp } = useMiniAppContext();
  const [open, setOpen] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Only show in Farcaster miniapp context when app is not added
  if (!isMiniApp || platform !== "farcaster" || isAppAdded) {
    return null;
  }

  const handleAddApp = async () => {
    setIsAdding(true);
    const success = await addMiniApp();
    setIsAdding(false);
    if (success) {
      setOpen(false);
    }
  };

  const handleMaybeLater = () => {
     localStorage.setItem('farcaster-app-modal-dismissed', Date.now().toString());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold uppercase tracking-tight text-center text-zinc-900 dark:text-white">
            Add to your apps?
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            We&apos;ll send you updates when something interesting happens.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <button
            onClick={handleAddApp}
            disabled={isAdding}
            className="w-full px-6 py-3 text-xs font-medium uppercase tracking-wide border border-zinc-900 bg-zinc-900 text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed dark:border-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add App"
            )}
          </button>
          <button
            onClick={handleMaybeLater}
            disabled={isAdding}
            className="w-full py-2 text-xs font-medium uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            Maybe Later
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
