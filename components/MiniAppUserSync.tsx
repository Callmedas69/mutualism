"use client";

import { useEffect } from "react";
import { useFarcasterUser } from "@/context/FarcasterProvider";
import { useMiniAppContext } from "@/context/MiniAppProvider";

/**
 * Syncs miniapp user to FarcasterProvider.
 * This allows all existing components using useFarcasterUser() to work in miniapp mode.
 * Renders nothing - just a sync bridge between providers.
 */
export default function MiniAppUserSync() {
  const { user: miniAppUser, isMiniApp, isReady } = useMiniAppContext();
  const { user: farcasterUser, setUserFromMiniApp } = useFarcasterUser();

  useEffect(() => {
    // Only sync if:
    // 1. We're in miniapp mode
    // 2. MiniApp is ready
    // 3. MiniApp has a user
    // 4. FarcasterProvider doesn't have a user yet
    if (isMiniApp && isReady && miniAppUser && !farcasterUser) {
      setUserFromMiniApp(miniAppUser);
    }
  }, [isMiniApp, isReady, miniAppUser, farcasterUser, setUserFromMiniApp]);

  return null;
}
