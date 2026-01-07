"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useComposeCast } from "@coinbase/onchainkit/minikit";
import type { MiniAppUser } from "@/lib/miniapp";

// Platform detection: farcaster (Warpcast), base (Coinbase Wallet), or web
type MiniAppPlatform = "farcaster" | "base" | "web";

interface MiniAppContextType {
  isMiniApp: boolean;
  isReady: boolean;
  isAppAdded: boolean;
  platform: MiniAppPlatform;
  user: MiniAppUser | null;
  signalReady: () => Promise<void>;
  composeCast: (text?: string, embeds?: string[]) => Promise<void>;
  closeMiniApp: () => Promise<void>;
  openUrl: (url: string) => Promise<void>;
  viewProfile: (fid: number) => Promise<void>;
  addMiniApp: () => Promise<boolean>;
}

const MiniAppContext = createContext<MiniAppContextType | null>(null);

export function useMiniAppContext() {
  const context = useContext(MiniAppContext);
  if (!context) {
    throw new Error("useMiniAppContext must be used within MiniAppProvider");
  }
  return context;
}

interface MiniAppProviderProps {
  children: ReactNode;
}

export default function MiniAppProvider({ children }: MiniAppProviderProps) {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isAppAdded, setIsAppAdded] = useState(false);
  const [platform, setPlatform] = useState<MiniAppPlatform>("web");
  const [user, setUser] = useState<MiniAppUser | null>(null);

  // OnchainKit's composeCast hook for Base miniapp
  const { composeCast: onchainComposeCast } = useComposeCast();

  // Initialize SDK and detect miniapp environment
  useEffect(() => {
    const init = async () => {
      try {
        // Check if we're in Farcaster miniapp environment
        // The SDK context is a Promise that resolves with the context
        const context = await sdk.context;

        if (context) {
          setIsMiniApp(true);
          setPlatform("farcaster");

          // Extract user from context
          if (context.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
          }

          // Check if app is already added (client.added is true when app is in user's favorites)
          if (context.client?.added) {
            setIsAppAdded(true);
          }
        } else {
          // Not Farcaster - check if we're in an iframe (could be Base miniapp)
          const inIframe = typeof window !== "undefined" && window.self !== window.top;
          if (inIframe) {
            setIsMiniApp(true);
            setPlatform("base");
          }
        }
        // Mark provider as ready (does NOT call sdk.actions.ready() here)
        // Pages should call signalReady() when their content is visible
        setIsReady(true);
      } catch {
        // SDK context failed - check if we're in an iframe (could be Base miniapp)
        try {
          const inIframe = typeof window !== "undefined" && window.self !== window.top;
          if (inIframe) {
            setIsMiniApp(true);
            setPlatform("base");
          }
        } catch {
          // Cross-origin iframe - likely Base miniapp
          setIsMiniApp(true);
          setPlatform("base");
        }
        setIsReady(true);
      }
    };

    init();
  }, []);

  // Signal to Farcaster that the app is ready (hides splash screen)
  // Should be called by pages when their content is visible
  const [hasSignaledReady, setHasSignaledReady] = useState(false);
  const signalReady = useCallback(async () => {
    if (!isMiniApp || hasSignaledReady) return;
    try {
      await sdk.actions.ready();
      setHasSignaledReady(true);
    } catch (error) {
      console.error("Failed to signal ready:", error);
    }
  }, [isMiniApp, hasSignaledReady]);

  // Action handlers - dual platform support
  const composeCast = useCallback(async (text?: string, embeds?: string[]) => {
    if (!isMiniApp) return;

    // Try Farcaster SDK first if we detected Farcaster platform
    if (platform === "farcaster") {
      try {
        const embedsTuple = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined;
        await sdk.actions.composeCast({
          text,
          embeds: embedsTuple,
        });
        return;
      } catch (error) {
        console.error("Farcaster composeCast failed, trying OnchainKit:", error);
        // Fall through to OnchainKit
      }
    }

    // Use OnchainKit's composeCast for Base miniapp or as fallback
    try {
      const embedsTuple = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined;
      onchainComposeCast({
        text,
        embeds: embedsTuple,
      });
    } catch (error) {
      console.error("Failed to compose cast:", error);
    }
  }, [isMiniApp, platform, onchainComposeCast]);

  const closeMiniApp = useCallback(async () => {
    if (!isMiniApp) return;
    try {
      await sdk.actions.close();
    } catch (error) {
      console.error("Failed to close miniapp:", error);
    }
  }, [isMiniApp]);

  const openUrl = useCallback(async (url: string) => {
    if (!isMiniApp) {
      window.open(url, "_blank");
      return;
    }
    try {
      await sdk.actions.openUrl(url);
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  }, [isMiniApp]);

  const viewProfile = useCallback(async (fid: number) => {
    if (!isMiniApp) {
      window.open(`https://warpcast.com/~/profiles/${fid}`, "_blank");
      return;
    }
    try {
      await sdk.actions.viewProfile({ fid });
    } catch (error) {
      console.error("Failed to view profile:", error);
    }
  }, [isMiniApp]);

  const addMiniApp = useCallback(async (): Promise<boolean> => {
    if (!isMiniApp || platform !== "farcaster") {
      // Only available in Farcaster miniapp
      return false;
    }
    try {
      await sdk.actions.addMiniApp();
      setIsAppAdded(true);
      return true;
    } catch (error) {
      console.error("Failed to add miniapp:", error);
      return false;
    }
  }, [isMiniApp, platform]);

  const value: MiniAppContextType = {
    isMiniApp,
    isReady,
    isAppAdded,
    platform,
    user,
    signalReady,
    composeCast,
    closeMiniApp,
    openUrl,
    viewProfile,
    addMiniApp,
  };

  // Don't render until ready (prevents flash)
  if (!isReady) {
    return null;
  }

  return (
    <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>
  );
}
