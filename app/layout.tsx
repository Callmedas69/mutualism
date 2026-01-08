import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context";
import FarcasterProvider from "@/context/FarcasterProvider";
import MiniAppProvider from "@/context/MiniAppProvider";
import Navbar from "@/components/Navbar";
import MiniAppNavbar from "@/components/MiniAppNavbar";
import MainContent from "@/components/MainContent";
import MiniAppUserSync from "@/components/MiniAppUserSync";
import { PageTransitionProvider } from "@/components/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Domain for miniapp metadata
const domain = process.env.NEXT_PUBLIC_DOMAIN_URL || "https://mutualism.geoart.studio";

// Farcaster miniapp embed configuration (Base App compatible)
const miniAppEmbed = {
  version: "next",
  imageUrl: `${domain}/og-miniapp.png`,
  button: {
    title: "Your Graph",
    action: {
      type: "launch_miniapp",
      name: "MUTUALISM",
      url: `${domain}/graph`,
      splashImageUrl: `${domain}/splash-200.png`,
      splashBackgroundColor: "#ffffff",
    },
  },
};

export const metadata: Metadata = {
  title: "MUTUALISM",
  description: "Visualize your Farcaster network and post your social graph to Zora",
  appleWebApp: {
    title: "Mutualism",
  },
  openGraph: {
    title: "MUTUALISM",
    description: "Visualize your Farcaster network and post your social graph to Zora",
    images: [`${domain}/og-miniapp.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
    'base:app_id': '6957415fc63ad876c9081d0c',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ContextProvider>
          <FarcasterProvider>
            <MiniAppProvider>
              <MiniAppUserSync />
              <PageTransitionProvider>
                <Navbar />
                <MainContent>{children}</MainContent>
                <MiniAppNavbar />
              </PageTransitionProvider>
            </MiniAppProvider>
          </FarcasterProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
