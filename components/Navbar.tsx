"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X } from "lucide-react";
import { useFarcasterUser } from "@/context/FarcasterProvider";
import { useMiniApp } from "@/hooks/useMiniApp";
import { TransitionLink } from "./TransitionLink";

export default function Navbar() {
  const pathname = usePathname();
  const { isMiniApp } = useMiniApp();
  const { user, signOut } = useFarcasterUser();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuState, setMobileMenuState] = useState<"closed" | "open" | "closing">("closed");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close mobile menu with animation
  const closeMobileMenu = useCallback(() => {
    setMobileMenuState((prev) => {
      if (prev === "open") {
        closeTimeoutRef.current = setTimeout(() => setMobileMenuState("closed"), 150);
        return "closing";
      }
      return prev;
    });
  }, []);

  // Toggle mobile menu
  const toggleMobileMenu = useCallback(() => {
    setMobileMenuState((prev) => {
      if (prev === "closed") return "open";
      if (prev === "open") {
        closeTimeoutRef.current = setTimeout(() => setMobileMenuState("closed"), 150);
        return "closing";
      }
      return prev;
    });
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuState === "open") {
      document.body.style.overflow = "hidden";
    } else if (mobileMenuState === "closed") {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuState]);

  // Escape key and click outside handlers
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuState === "open") {
        closeMobileMenu();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mobileMenuState === "open" &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target)
      ) {
        // Check if click is on the toggle button (allow toggle to handle it)
        const toggleButton = document.querySelector('[aria-label="Close menu"]');
        if (toggleButton && toggleButton.contains(target)) return;
        closeMobileMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuState, closeMobileMenu]);

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

  // Check if link is active
  const isActive = (href: string) => pathname === href;

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
            className={`text-xs uppercase tracking-[0.15em] font-medium transition-colors ${
              isActive("/")
                ? "text-[#f25b28]"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Home
          </TransitionLink>
          <TransitionLink
            href="/graph"
            className={`text-xs uppercase tracking-[0.15em] font-medium transition-colors ${
              isActive("/graph")
                ? "text-[#f25b28]"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Graph
          </TransitionLink>
          <TransitionLink
            href="/gallery"
            className={`text-xs uppercase tracking-[0.15em] font-medium transition-colors ${
              isActive("/gallery")
                ? "text-[#f25b28]"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Gallery
          </TransitionLink>
        </div>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {/* Farcaster User with Dropdown - Desktop */}
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

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="flex h-10 w-10 items-center justify-center text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white md:hidden"
            aria-label={mobileMenuState !== "closed" ? "Close menu" : "Open menu"}
          >
            {mobileMenuState !== "closed" ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuState !== "closed" && (
        <div
          ref={mobileMenuRef}
          className={`border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden ${
            mobileMenuState === "open"
              ? "animate-in slide-in-from-top-2 fade-in duration-150"
              : "animate-out slide-out-to-top-2 fade-out duration-150"
          }`}
        >
          <div className="flex flex-col px-4 py-4">
            <TransitionLink
              href="/"
              onClick={closeMobileMenu}
              className={`py-3 text-sm uppercase tracking-[0.1em] font-medium transition-colors ${
                isActive("/")
                  ? "text-[#f25b28]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Home
            </TransitionLink>
            <TransitionLink
              href="/graph"
              onClick={closeMobileMenu}
              className={`py-3 text-sm uppercase tracking-[0.1em] font-medium transition-colors ${
                isActive("/graph")
                  ? "text-[#f25b28]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Graph
            </TransitionLink>
            <TransitionLink
              href="/gallery"
              onClick={closeMobileMenu}
              className={`py-3 text-sm uppercase tracking-[0.1em] font-medium transition-colors ${
                isActive("/gallery")
                  ? "text-[#f25b28]"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Gallery
            </TransitionLink>
            {user && (
              <>
                <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
                <div className="py-2 text-xs uppercase tracking-[0.1em] text-zinc-400">
                  @{user.username}
                </div>
                <button
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className="py-3 text-left text-sm uppercase tracking-[0.1em] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
