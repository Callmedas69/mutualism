"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export interface SearchUser {
  fid: number;
  username: string;
  display_name: string | null;
  pfp_url: string | null;
}

interface UseUserSearchResult {
  results: SearchUser[];
  loading: boolean;
  search: (query: string) => void;
  clear: () => void;
}

const DEBOUNCE_MS = 500; // Increased to reduce API calls (free tier: 6 req/60s)

export function useUserSearch(): UseUserSearchResult {
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const search = useCallback((query: string) => {
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear results if query is too short (3+ chars to reduce API calls)
    if (!query || query.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Debounce the actual search
    debounceTimerRef.current = setTimeout(async () => {
      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await fetch(
          `/api/users/search?q=${encodeURIComponent(query)}`,
          { signal: abortController.signal }
        );

        if (!res.ok) {
          console.error("User search failed:", res.status);
          setResults([]);
          return;
        }

        const data = await res.json();
        setResults(data.users || []);
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error("User search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setResults([]);
    setLoading(false);
  }, []);

  return {
    results,
    loading,
    search,
    clear,
  };
}
