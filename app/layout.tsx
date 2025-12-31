import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ContextProvider from "@/context";
import FarcasterProvider from "@/context/FarcasterProvider";
import Navbar from "@/components/Navbar";
import { PageTransitionProvider } from "@/components/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MUTUALISM",
  description: "Quotient Mutual - Base Network dApp",
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
            <PageTransitionProvider>
              <Navbar />
              <main className="pt-16">{children}</main>
            </PageTransitionProvider>
          </FarcasterProvider>
        </ContextProvider>
      </body>
    </html>
  );
}
