"use client";

import { useEffect, useRef } from "react";

/**
 * Track user's graph page visit
 *
 * Sends a single request when user views their graph.
 * Used for reminder notification scheduling.
 */
export function useTrackVisit(fid: number | undefined, mutualCount?: number) {
  const tracked = useRef(false);

  useEffect(() => {
    // Only track once per session and only if we have a valid fid
    if (!fid || tracked.current) return;

    tracked.current = true;

    // Fire and forget - don't block UI
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fid, mutualCount }),
    }).catch((error) => {
      // Silent fail - tracking is non-critical
      console.warn("[Track Visit] Failed:", error);
    });
  }, [fid, mutualCount]);
}
