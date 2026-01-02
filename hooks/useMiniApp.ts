"use client";

import { useMiniAppContext } from "@/context/MiniAppProvider";

/**
 * Hook to access miniapp context and actions
 *
 * Usage:
 * ```tsx
 * const { isMiniApp, user, composeCast, viewProfile } = useMiniApp();
 *
 * // Check if in miniapp mode
 * if (isMiniApp) {
 *   // Use miniapp-specific features
 * }
 *
 * // Share a cast
 * await composeCast("Check out my graph!", ["https://mutualism.app"]);
 * ```
 */
export function useMiniApp() {
  return useMiniAppContext();
}

export default useMiniApp;
