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
import type { MiniAppUser } from "@/lib/miniapp";

interface MiniAppContextType {
  isMiniApp: boolean;
  isReady: boolean;
  user: MiniAppUser | null;
  signalReady: () => Promise<void>;
  composeCast: (text?: string, embeds?: string[]) => Promise<void>;
  closeMiniApp: () => Promise<void>;
  openUrl: (url: string) => Promise<void>;
  viewProfile: (fid: number) => Promise<void>;
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
  const [user, setUser] = useState<MiniAppUser | null>(null);

  // Initialize SDK and detect miniapp environment
  useEffect(() => {
    const init = async () => {
      try {
        // Check if we're in miniapp environment
        // The SDK context is a Promise that resolves with the context
        const context = await sdk.context;

        if (context) {
          setIsMiniApp(true);

          // Extract user from context
          if (context.user) {
            setUser({
              fid: context.user.fid,
              username: context.user.username,
              displayName: context.user.displayName,
              pfpUrl: context.user.pfpUrl,
            });
          }
        }
        // Mark provider as ready (does NOT call sdk.actions.ready() here)
        // Pages should call signalReady() when their content is visible
        setIsReady(true);
      } catch {
        // Not in miniapp environment, just continue
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

  // Action handlers
  const composeCast = useCallback(async (text?: string, embeds?: string[]) => {
    if (!isMiniApp) return;
    try {
      // SDK expects embeds as a tuple of up to 2 strings
      const embedsTuple = embeds?.slice(0, 2) as [] | [string] | [string, string] | undefined;
      await sdk.actions.composeCast({
        text,
        embeds: embedsTuple,
      });
    } catch (error) {
      console.error("Failed to compose cast:", error);
    }
  }, [isMiniApp]);

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

  const value: MiniAppContextType = {
    isMiniApp,
    isReady,
    user,
    signalReady,
    composeCast,
    closeMiniApp,
    openUrl,
    viewProfile,
  };

  // Don't render until ready (prevents flash)
  if (!isReady) {
    return null;
  }

  return (
    <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>
  );
}
