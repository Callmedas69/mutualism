import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_PROJECT_ID is not defined");
}

// Alchemy RPC for Base
const baseRpcUrl = alchemyApiKey
  ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
  : "https://mainnet.base.org";

// RainbowKit config for standalone web mode
export const config = getDefaultConfig({
  appName: "MUTUALISM",
  projectId,
  chains: [base],
  transports: {
    [base.id]: http(baseRpcUrl),
  },
  ssr: true,
});

// MiniApp config for Farcaster miniapp mode (no RainbowKit)
export const miniAppConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(baseRpcUrl),
  },
  connectors: [farcasterMiniApp()],
  ssr: true,
});
