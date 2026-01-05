"use client";

import { useState, useRef, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useFarcasterUser } from "@/context/FarcasterProvider";
import { useMiniApp } from "@/hooks/useMiniApp";
import { TransitionLink } from "./TransitionLink";

export default function Navbar() {
  const { isMiniApp } = useMiniApp();
  const { user, signOut } = useFarcasterUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hide navbar in miniapp mode (Farcaster client provides header)
  if (isMiniApp) return null;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm dark:bg-zinc-950/90">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 lg:px-16">
        {/* Logo */}
        <TransitionLink href="/" className="flex items-center">
          <span className="text-xl sm:text-2xl font-black tracking-tighter text-zinc-900 dark:text-white">
            <span className="text-[#f25b28]">M</span>UTUALISM
          </span>
        </TransitionLink>

        {/* Navigation Links - Center */}
        <div className="hidden items-center gap-8 md:flex">
          <TransitionLink
            href="/"
            className="text-xs uppercase tracking-[0.15em] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Home
          </TransitionLink>
          <TransitionLink
            href="/graph"
            className="text-xs uppercase tracking-[0.15em] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Graph
          </TransitionLink>
          {/* <TransitionLink
            href="/gallery"
            className="text-xs uppercase tracking-[0.15em] font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            Gallery
          </TransitionLink> */}
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {/* Farcaster User with Dropdown */}
          {user && (
            <div ref={dropdownRef} className="relative hidden sm:block">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.1em] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                @{user.username}
                <svg
                  className={`h-3 w-3 transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 min-w-[160px] border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-150">
                  <TransitionLink
                    href="/graph"
                    onClick={() => setShowDropdown(false)}
                    className="block px-4 py-3 text-xs uppercase tracking-[0.1em] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                  >
                    Graph
                  </TransitionLink>
                  <button
                    onClick={() => {
                      signOut();
                      setShowDropdown(false);
                    }}
                    className="w-full border-t border-zinc-200 px-4 py-3 text-left text-xs uppercase tracking-[0.1em] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Wallet Connect */}
          <ConnectButton
            showBalance={false}
            chainStatus="none"
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "address",
            }}
          />
        </div>
      </div>
    </nav>
  );
}
