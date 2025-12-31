"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { config } from "@/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme, darkTheme } from "@rainbow-me/rainbowkit";
import React, { type ReactNode } from "react";
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

const customDarkTheme = {
  ...darkTheme({
    accentColor: "#f25b28",
    accentColorForeground: "white",
    borderRadius: "none",
  }),
  fonts: {
    body: "inherit",
  },
};

export default function ContextProvider({
  children,
}: {
  children: ReactNode;
}) {
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
