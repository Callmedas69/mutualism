"use client";

import { ReactNode, useEffect } from "react";
import { useFarcasterUser } from "@/context/FarcasterProvider";
import { useMiniApp } from "@/hooks/useMiniApp";
import FarcasterSignInButton from "../FarcasterSignInButton";

interface AuthGateProps {
  children: ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const { user } = useFarcasterUser();
  const { isMiniApp, signalReady } = useMiniApp();

  // Signal to Farcaster that the app is ready
  useEffect(() => {
    signalReady();
  }, [signalReady]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8">
        {/* Loading spinner for miniapp mode */}
        {isMiniApp && (
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-zinc-200 dark:border-zinc-700" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-900 dark:border-t-white animate-spin" />
          </div>
        )}
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            {isMiniApp ? "Connecting..." : "Authentication Required"}
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
            {isMiniApp ? "Loading Your Graph" : "Sign in to continue"}
          </h2>
          <p className="mt-3 text-sm uppercase tracking-[0.05em] text-zinc-500 dark:text-zinc-400">
            {isMiniApp
              ? "Syncing with Farcaster"
              : "Connect with Farcaster to view your social graph"}
          </p>
        </div>
        {/* Only show SIWF button in web mode */}
        {!isMiniApp && <FarcasterSignInButton />}
      </div>
    );
  }

  // Key forces remount when user changes, ensuring fresh data fetch
  return <div key={user.fid}>{children}</div>;
}
