"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TransitionLink } from "@/components/TransitionLink";
import { sdk } from "@farcaster/miniapp-sdk";
import { useMiniAppContext } from "@/context/MiniAppProvider";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { isMiniApp } = useMiniAppContext();

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(".hero-line", {
        y: 100,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
      })
        .from(".hero-tag", { opacity: 0, x: -20, duration: 0.6 }, "-=0.4")
        .from(".hero-subtext", { opacity: 0, y: 20, duration: 0.6 }, "-=0.3")
        .from(".hero-cta", { opacity: 0, y: 20, duration: 0.6 }, "-=0.2")
    },
    { scope: heroRef }
  );

  // Signal to Farcaster that the app is ready (hides splash screen)
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <section
      ref={heroRef}
      className={`relative flex flex-col px-4 sm:px-8 lg:px-16 overflow-hidden ${
        isMiniApp
          ? "h-[calc(100dvh-5rem)] justify-center items-center text-center"
          : "min-h-[calc(100vh-9rem)] justify-end"
      }`}
    >
      {/* Main Typography */}
      <div className={`relative ${isMiniApp ? "flex flex-col items-center" : ""}`}>
        {/* Overline Tag - hidden in miniapp */}
        {!isMiniApp && (
          <div className="hero-tag">
            <p className="text-xs sm:text-sm lg:text-base tracking-[0.2em] text-zinc-500 dark:text-zinc-400 uppercase">
              farcaster social graph
            </p>
          </div>
        )}

        {/* Line 1 */}
        <div className="overflow-hidden">
          <h1 className="hero-line text-[11vw] sm:text-[10vw] lg:text-[9vw] font-black uppercase leading-[0.85] tracking-tighter text-zinc-900 dark:text-white">
            RELATIONSHIPS
          </h1>
        </div>

        {/* Line 2 */}
        <div className="overflow-hidden">
          <h1 className="hero-line text-[11vw] sm:text-[10vw] lg:text-[9vw] font-black uppercase leading-[0.85] tracking-tighter text-zinc-900 dark:text-white">
            ARE MUTUAL.
          </h1>
        </div>

        {/* Line 3 - The Question */}
        <div className="overflow-hidden flex items-end justify-between">
          <h1 className="hero-line text-[11vw] sm:text-[10vw] lg:text-[9vw] font-black uppercase leading-[0.85] tracking-tighter text-zinc-900 dark:text-white flex items-baseline">
            <span>YOURS ? Y/N</span>
            <span className="inline-block w-[0.03em] h-[0.75em] bg-zinc-900 dark:bg-white ml-2 sm:ml-5 animate-blink" />
          </h1>
        </div>
      </div>

      {/* Subtext and CTA - hidden in miniapp */}
      {!isMiniApp && (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <p className="hero-subtext text-sm sm:text-base lg:text-xl text-zinc-400 dark:text-zinc-400 max-w-5xl italic">
            a follow is not a relationship. see who actually engages with you, and who you engage with back.
          </p>

          <TransitionLink
            href="/graph"
            className="hero-cta w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-medium uppercase tracking-[0.1em] text-zinc-900 dark:text-white border border-zinc-900 dark:border-white hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-colors whitespace-nowrap"
          >
            SEE YOUR GRAPH
          </TransitionLink>
        </div>
      )}

    </section>
  );
}
