import { NextResponse } from "next/server";

export async function GET() {
  const domain = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://mutualism.geoart.studio";

  const manifest = {
    accountAssociation: {
      // Generated via Farcaster Developer Tools after deployment
      // Leave empty for local development
      header: "",
      payload: "",
      signature: "",
    },
    miniapp: {
      version: "1",
      name: "MUTUALISM",
      homeUrl: domain,
      iconUrl: `${domain}/icon-1024.png`,
      splashImageUrl: `${domain}/splash-200.png`,
      splashBackgroundColor: "#18181b",
      webhookUrl: `${domain}/api/miniapp/webhook`,
      subtitle: "Visualize Your Farcaster Network",
      description:
        "Explore your mutual connections, tokenize your social graph on Zora",
      primaryCategory: "social",
      tags: ["farcaster", "social", "nft", "zora"],
      requiredChains: ["eip155:8453"], // Base
    },
  };

  return NextResponse.json(manifest);
}
