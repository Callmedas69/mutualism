import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context";
import FarcasterProvider from "@/context/FarcasterProvider";
import MiniAppProvider from "@/context/MiniAppProvider";
import Navbar from "@/components/Navbar";
import MiniAppNavbar from "@/components/MiniAppNavbar";
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
const domain = process.env.NEXT_PUBLIC_DOMAIN_URL || "http://localhost:3000";

// Farcaster miniapp embed configuration
const miniAppEmbed = {
  version: "1",
  imageUrl: `${domain}/og-miniapp.png`,
  button: {
    title: "Open MUTUALISM",
    action: {
      type: "launch_frame",
      name: "MUTUALISM",
      url: domain,
      splashImageUrl: `${domain}/splash-200.png`,
      splashBackgroundColor: "#18181b",
    },
  },
};

export const metadata: Metadata = {
  title: "MUTUALISM",
  description: "Visualize your Farcaster network and tokenize your social graph on Zora",
  openGraph: {
    title: "MUTUALISM",
    description: "Visualize your Farcaster network and tokenize your social graph on Zora",
    images: [`${domain}/og-miniapp.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
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
              <PageTransitionProvider>
                <Navbar />
                <main className="pb-20 pt-16">{children}</main>
                <MiniAppNavbar />
              </PageTransitionProvider>
            </MiniAppProvider>
          </FarcasterProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
