"use client";

import { createContext, useContext, useRef, useCallback, ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import gsap from "gsap";

interface TransitionContextType {
  navigateTo: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType | null>(null);

export function usePageTransition() {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used within PageTransitionProvider");
  }
  return context;
}

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const pendingReveal = useRef(false);
  const [currentPath, setCurrentPath] = useState(pathname);

  // When pathname actually changes, trigger the reveal
  useEffect(() => {
    if (pathname !== currentPath && pendingReveal.current) {
      setCurrentPath(pathname);

      // Reveal animation
      const overlay = overlayRef.current;
      if (overlay) {
        gsap.set(overlay, { transformOrigin: "right" });
        gsap.to(overlay, {
          scaleX: 0,
          duration: 0.6,
          ease: "power4.inOut",
          onComplete: () => {
            isAnimating.current = false;
            pendingReveal.current = false;
          },
        });
      }
    }
  }, [pathname, currentPath]);

  const navigateTo = useCallback(
    (href: string) => {
      // Prevent if already animating or same page
      if (isAnimating.current || href === pathname) return;
      isAnimating.current = true;
      pendingReveal.current = true;

      const overlay = overlayRef.current;
      if (!overlay) {
        router.push(href);
        return;
      }

      // Wipe in (cover screen)
      gsap.set(overlay, { scaleX: 0, transformOrigin: "left" });
      gsap.to(overlay, {
        scaleX: 1,
        duration: 0.6,
        ease: "power4.inOut",
        onComplete: () => {
          // Navigate while covered
          router.push(href);
        },
      });
    },
    [router, pathname]
  );

  return (
    <TransitionContext.Provider value={{ navigateTo }}>
      {/* Transition Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] bg-zinc-900 dark:bg-white pointer-events-none"
        style={{ transform: "scaleX(0)", transformOrigin: "left" }}
      />

      {/* Page Content */}
      <div>{children}</div>
    </TransitionContext.Provider>
  );
}
