"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { SnapshotUploadResponse } from "@/types/tokenize";
import { uploadSnapshot, mapGraphTypeToView } from "@/lib/pinata";

// ============================================
// Types
// ============================================

export interface SnapshotCache {
  imageCid: string;
  metadataCid: string;
  metadataUri: string;
  gatewayUrl: string;
}

export interface UseSnapshotCacheParams {
  getGraphBlob: () => Promise<Blob | null>;
  graphData: {
    fid: number;
    username: string;
    graphType: string;
  };
  isGraphReady: boolean;
}

export interface UseSnapshotCacheReturn {
  snapshot: SnapshotCache | null;
  ensureSnapshot: () => Promise<SnapshotCache>;
  clearCache: (reason?: string) => void;
  retry: () => void;
  isUploading: boolean;
  error: string | null;
  canSnapshot: boolean;
}

// ============================================
// Constants
// ============================================

const LOG_PREFIX = "[Snapshot]";
const UPLOAD_TIMEOUT_MS = 30_000;

// ============================================
// Validation
// ============================================

/**
 * Validate CID format (CIDv0 or CIDv1)
 */
function isValidCid(cid: string): boolean {
  // CIDv0: starts with Qm, 46 chars
  // CIDv1: starts with b, variable length (typically 59+ chars)
  return /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid) || /^b[a-z2-7]{50,}$/.test(cid);
}

// ============================================
// Helpers
// ============================================

/**
 * Race a promise against a timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// ============================================
// Hook
// ============================================

export function useSnapshotCache({
  getGraphBlob,
  graphData,
  isGraphReady,
}: UseSnapshotCacheParams): UseSnapshotCacheReturn {
  const [snapshot, setSnapshot] = useState<SnapshotCache | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Race condition prevention: track in-progress upload
  const uploadPromiseRef = useRef<Promise<SnapshotCache> | null>(null);

  // Cleanup on unmount
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      console.debug(`${LOG_PREFIX} Component unmounting, aborting`);
      mountedRef.current = false;
    };
  }, []);

  // Clear cache when graph data changes
  const prevGraphKeyRef = useRef<string | null>(null);
  const graphKey = `${graphData.fid}-${graphData.graphType}`;

  useEffect(() => {
    if (prevGraphKeyRef.current !== null && prevGraphKeyRef.current !== graphKey) {
      console.debug(`${LOG_PREFIX} Cache cleared (reason: graph data changed)`);
      setSnapshot(null);
      setError(null);
      uploadPromiseRef.current = null;
    }
    prevGraphKeyRef.current = graphKey;
  }, [graphKey]);

  /**
   * Clear cache manually
   */
  const clearCache = useCallback((reason: string = "manual") => {
    console.debug(`${LOG_PREFIX} Cache cleared (reason: ${reason})`);
    setSnapshot(null);
    setError(null);
    uploadPromiseRef.current = null;
  }, []);

  /**
   * Retry after error (clear error and cache)
   */
  const retry = useCallback(() => {
    console.debug(`${LOG_PREFIX} Retry requested`);
    setError(null);
    setSnapshot(null);
    uploadPromiseRef.current = null;
  }, []);

  /**
   * Ensure snapshot exists (upload if needed, return from cache if exists)
   */
  const ensureSnapshot = useCallback(async (): Promise<SnapshotCache> => {
    // 1. Return cached result if exists
    if (snapshot) {
      console.debug(`${LOG_PREFIX} Cache hit, reusing existing`);
      return snapshot;
    }

    // 2. If upload already in progress, wait for it (prevents duplicate uploads)
    if (uploadPromiseRef.current) {
      console.debug(`${LOG_PREFIX} Upload in progress, waiting...`);
      return uploadPromiseRef.current;
    }

    // 3. Check graph is ready
    if (!isGraphReady) {
      console.warn(`${LOG_PREFIX} Graph not ready, aborting`);
      throw new Error("Graph is still loading. Please wait.");
    }

    console.debug(`${LOG_PREFIX} Cache miss, starting upload`);
    setIsUploading(true);
    setError(null);

    // 4. Start new upload and store the promise
    uploadPromiseRef.current = (async (): Promise<SnapshotCache> => {
      // Generate blob
      console.debug(`${LOG_PREFIX} Generating graph blob...`);
      const blob = await getGraphBlob();
      if (!blob) {
        console.error(`${LOG_PREFIX} Failed to generate blob`);
        throw new Error("Failed to capture graph");
      }

      // Upload to Pinata with timeout
      console.info(`${LOG_PREFIX} Uploading to Pinata for fid:${graphData.fid}`);
      const view = mapGraphTypeToView(graphData.graphType);

      const result: SnapshotUploadResponse = await withTimeout(
        uploadSnapshot({
          imageBlob: blob,
          fid: graphData.fid,
          username: graphData.username,
          view,
          timeWindow: "all_time",
        }),
        UPLOAD_TIMEOUT_MS,
        "Upload timed out. Please try again."
      );

      // Validate response
      if (!isValidCid(result.imageCid)) {
        console.error(`${LOG_PREFIX} Invalid imageCid received:`, result.imageCid);
        throw new Error("Invalid response from storage");
      }
      if (!isValidCid(result.metadataCid)) {
        console.error(`${LOG_PREFIX} Invalid metadataCid received:`, result.metadataCid);
        throw new Error("Invalid response from storage");
      }

      console.info(`${LOG_PREFIX} Upload complete: ${result.imageCid}`);

      const cacheResult: SnapshotCache = {
        imageCid: result.imageCid,
        metadataCid: result.metadataCid,
        metadataUri: result.metadataUri,
        gatewayUrl: result.gatewayUrl,
      };

      // Only update state if still mounted
      if (mountedRef.current) {
        setSnapshot(cacheResult);
      }

      return cacheResult;
    })();

    try {
      return await uploadPromiseRef.current;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";

      if (message.includes("timed out")) {
        console.warn(`${LOG_PREFIX} Upload timed out after 30s`);
      } else {
        console.error(`${LOG_PREFIX} Upload failed:`, err);
      }

      if (mountedRef.current) {
        setError(message);
      }
      throw err;
    } finally {
      uploadPromiseRef.current = null;
      if (mountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [snapshot, getGraphBlob, graphData, isGraphReady]);

  // Can snapshot when graph is ready and not uploading
  const canSnapshot = isGraphReady && !isUploading;

  return {
    snapshot,
    ensureSnapshot,
    clearCache,
    retry,
    isUploading,
    error,
    canSnapshot,
  };
}
