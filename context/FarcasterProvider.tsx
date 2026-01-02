"use client";

import "@farcaster/auth-kit/styles.css";
import { AuthKitProvider } from "@farcaster/auth-kit";
import { ReactNode, createContext, useContext, useState, useCallback, useEffect } from "react";
import { API } from "@/lib/constants";

const STORAGE_KEY = "farcaster_user";

// Farcaster user type
export interface FarcasterUser {
  fid: number;
  username: string;
  pfp_url?: string | null;
}

// MiniApp user type (from SDK context)
interface MiniAppUserData {
  fid: number;
  username?: string;
  pfpUrl?: string;
}

// Context for sharing signed-in user across components
interface FarcasterUserContextType {
  user: FarcasterUser | null;
  setUser: (user: FarcasterUser | null) => void;
  signOut: () => void;
  setUserFromMiniApp: (miniAppUser: MiniAppUserData) => void;
}

const FarcasterUserContext = createContext<FarcasterUserContextType | null>(null);

export function useFarcasterUser() {
  const context = useContext(FarcasterUserContext);
  if (!context) {
    throw new Error("useFarcasterUser must be used within FarcasterProvider");
  }
  return context;
}

const domain = process.env.NEXT_PUBLIC_FARCASTER_DOMAIN || "localhost:3000";
const domainWithoutPort = domain.replace(/:\d+$/, "");

const config = {
  relay: "https://relay.farcaster.xyz",
  rpcUrl: API.optimismRpc,
  domain: domainWithoutPort,
  siweUri:
    typeof window !== "undefined"
      ? window.location.origin
      : `http://${domain}`,
};

export default function FarcasterProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<FarcasterUser | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUserState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Wrapper to persist user to localStorage
  const setUser = useCallback((newUser: FarcasterUser | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, [setUser]);

  // Set user from MiniApp SDK context (no localStorage - ephemeral session)
  const setUserFromMiniApp = useCallback((miniAppUser: MiniAppUserData) => {
    const farcasterUser: FarcasterUser = {
      fid: miniAppUser.fid,
      username: miniAppUser.username || `user-${miniAppUser.fid}`,
      pfp_url: miniAppUser.pfpUrl || null,
    };
    // Use setUserState directly to skip localStorage persistence
    setUserState(farcasterUser);
  }, []);

  return (
    <AuthKitProvider config={config}>
      <FarcasterUserContext.Provider value={{ user, setUser, signOut, setUserFromMiniApp }}>
        {children}
      </FarcasterUserContext.Provider>
    </AuthKitProvider>
  );
}
