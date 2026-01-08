"use client";

import { useState } from "react";
import { useMiniAppContext } from "@/context/MiniAppProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bell, Zap, RefreshCw, Loader2 } from "lucide-react";

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
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Add Mutualism to your apps?
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-600 dark:text-zinc-400">
            Get the most out of your social graph
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-sm">New mutual alerts</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Get notified when someone follows you back
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-sm">Quick access</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                One tap from your apps screen
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-sm">Always up to date</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your graph, synced and ready
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2">
          <button
            onClick={handleAddApp}
            disabled={isAdding}
            className="w-full px-6 py-3 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:text-zinc-200 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:disabled:bg-zinc-600 dark:disabled:text-zinc-400 flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to My Apps"
            )}
          </button>
          <button
            onClick={handleMaybeLater}
            disabled={isAdding}
            className="w-full py-2 text-sm text-zinc-500 hover:text-zinc-700 transition-colors dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Maybe Later
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
