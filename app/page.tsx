"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { TransitionLink } from "@/components/TransitionLink";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);

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
        .from(".scroll-indicator", { opacity: 0, y: -10, duration: 0.6 }, "-=0.2");
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-end px-4 sm:px-8 lg:px-16 pb-12 sm:pb-16 lg:pb-24 overflow-hidden"
    >
      {/* Main Typography */}
      <div className="relative">
        {/* Overline Tag */}
        <div className="hero-tag ">
          <p className="text-[12px] sm:text-2xl uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            FARCASTER SOCIAL GRAPH
          </p>
        </div>

        {/* Line 1 */}
        <div className="overflow-hidden">
          <h1 className="hero-line text-[12vw] sm:text-[10vw] lg:text-[9vw] font-black uppercase leading-[0.85] tracking-tighter text-zinc-900 dark:text-white">
            RELATIONSHIPS
          </h1>
        </div>

        {/* Line 2 */}
        <div className="overflow-hidden">
          <h1 className="hero-line text-[12vw] sm:text-[10vw] lg:text-[9vw] font-black uppercase leading-[0.85] tracking-tighter text-zinc-900 dark:text-white">
            ARE MUTUAL.
          </h1>
        </div>

        {/* Line 3 - The Question */}
        <div className="overflow-hidden flex items-end justify-between">
          <h1 className="hero-line text-[12vw] sm:text-[10vw] lg:text-[9vw] font-black uppercase leading-[0.85] tracking-tighter text-zinc-900 dark:text-white flex items-baseline">
            <span>YOURS ? Y/N</span>
            <span className="inline-block w-[0.03em] h-[0.75em] bg-zinc-900 dark:bg-white ml-5 animate-blink" />
          </h1>

          {/* Scroll Indicator */}
          <div className="scroll-indicator hidden lg:flex flex-col items-center gap-2 pb-[1vw]">
            <svg
              className="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Subtext and CTA */}
      <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <p className="hero-subtext text-sm sm:text-base lg:text-2xl uppercase tracking-[0.15em] font-light text-zinc-500 dark:text-zinc-400 max-w-5xl leading-relaxed">
          A FOLLOW IS NOT A RELATIONSHIP. SEE WHO ACTUALLY ENGAGES WITH YOU - AND WHO YOU ENGAGE WITH BACK.
        </p>

        <TransitionLink
          href="/dashboard"
          className="hero-cta inline-flex items-center justify-center px-6 py-3 text-sm sm:text-base font-medium uppercase tracking-[0.1em] text-zinc-900 dark:text-white border border-zinc-900 dark:border-white hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-zinc-900 transition-colors whitespace-nowrap"
        >
          SEE YOUR GRAPH
        </TransitionLink>
      </div>

    </section>
  );
}
