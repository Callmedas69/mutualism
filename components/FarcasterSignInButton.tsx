"use client";

import { useSignIn, useProfile, QRCode } from "@farcaster/auth-kit";
import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { BRAND } from "@/lib/constants";
import { useFarcasterUser } from "@/context/FarcasterProvider";

export default function FarcasterSignInButton() {
  const { isAuthenticated, profile } = useProfile();
  const { user, setUser } = useFarcasterUser();
  const [showModal, setShowModal] = useState(false);
  const pollingStarted = useRef(false);

  const {
    signIn,
    connect,
    url,
    isPolling,
    isError,
    error,
  } = useSignIn({
    onStatusResponse: (res: any) => {
      console.log("📡 Status response:", res);
      // Detect completion directly from status response
      if (res.state === "completed" && res.fid) {
        const fid = typeof res.fid === "string" ? parseInt(res.fid, 10) : res.fid;
        console.log("✅ Sign-in COMPLETED:", { fid, username: res.username, pfpUrl: res.pfpUrl });
        setUser({
          fid,
          username: res.username,
          pfp_url: res.pfpUrl || null,
        });
        setShowModal(false);
        pollingStarted.current = false;
      }
    },
    onError: (err) => {
      console.error("❌ Farcaster sign-in error:", err);
      pollingStarted.current = false;
    },
  });

  // Start polling when URL becomes available
  useEffect(() => {
    const startPolling = async () => {
      if (url && showModal && !pollingStarted.current && !isPolling) {
        console.log("🚀 URL ready, calling signIn() to start polling...");
        pollingStarted.current = true;
        try {
          await signIn();
          console.log("✅ signIn() completed");
        } catch (err) {
          console.error("❌ signIn() error:", err);
          pollingStarted.current = false;
        }
      }
    };
    startPolling();
  }, [url, showModal, isPolling, signIn]);

  const handleClick = useCallback(async () => {
    console.log("🔘 Button clicked, connecting to relay...");
    setShowModal(true);
    pollingStarted.current = false;
    try {
      await connect();
      console.log("✅ Connected to relay, waiting for URL...");
    } catch (err) {
      console.error("❌ Connect error:", err);
    }
  }, [connect]);

  const handleClose = () => {
    setShowModal(false);
    pollingStarted.current = false;
  };

  // Show connected state - check context user or useProfile
  if (user || (isAuthenticated && profile)) {
    const displayName = user?.username || profile?.username || "Connected";
    return (
      <div
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: BRAND.colors.farcaster }}
      >
        <Image src="/farcaster_logo.svg" alt="Farcaster" width={14} height={14} />
        <span>@{displayName}</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPolling}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ backgroundColor: BRAND.colors.farcaster }}
      >
        <Image src="/farcaster_logo.svg" alt="Farcaster" width={14} height={14} />
        <span>{isPolling ? "Waiting..." : "Sign in with Farcaster"}</span>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="w-[320px] rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-white">
              Scan with Warpcast
            </h3>

            <div className="flex min-h-[280px] items-center justify-center rounded-xl bg-white p-2">
              {url ? (
                <QRCode uri={url} />
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                  <span className="text-sm">Connecting...</span>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {url
                ? isPolling
                  ? "Waiting for approval..."
                  : "Scan QR code with Warpcast"
                : "Establishing connection..."}
            </p>

            <button
              onClick={handleClose}
              className="mt-4 w-full rounded-lg bg-zinc-100 py-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Cancel
            </button>

            {isError && (
              <p className="mt-2 text-center text-sm text-red-500">
                {error?.message || "Sign-in failed"}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
