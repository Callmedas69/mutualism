"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { config, miniAppConfig } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import React, { type ReactNode, useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

// Custom orange theme matching the M in MUTUALISM
const customTheme = {
  ...lightTheme({
    accentColor: "#f25b28",
    accentColorForeground: "white",
    borderRadius: "none",
  }),
  fonts: {
    body: "inherit",
  },
};

/**
 * Detect if we're running in a Farcaster miniapp context
 * This checks if we're in an iframe (miniapps run in iframes/webviews)
 */
function detectMiniAppMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    // Check if we're in an iframe
    return window.self !== window.top;
  } catch {
    // Cross-origin iframe access throws - we're likely in a miniapp
    return true;
  }
}

export default function ContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsMiniApp(detectMiniAppMode());
    setMounted(true);
  }, []);

  // Wait for client-side detection
  if (!mounted) {
    return null;
  }

  // MiniApp mode: use miniAppConfig without RainbowKit
  if (isMiniApp) {
    return (
      <WagmiProvider config={miniAppConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  // Standalone web mode: use RainbowKit
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
