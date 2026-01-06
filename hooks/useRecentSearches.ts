"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "warmintro_recent_searches";
const MAX_ITEMS = 5;

export interface RecentSearch {
  username: string;
  pfp_url: string | null;
  fid: number;
  timestamp: number;
}

interface UseRecentSearchesResult {
  recent: RecentSearch[];
  addRecent: (search: Omit<RecentSearch, "timestamp">) => void;
  removeRecent: (fid: number) => void;
  clearRecent: () => void;
}

function getStoredSearches(): RecentSearch[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (error) {
    console.error("Failed to read recent searches from localStorage:", error);
    return [];
  }
}

function saveSearches(searches: RecentSearch[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch (error) {
    console.error("Failed to save recent searches to localStorage:", error);
  }
}

export function useRecentSearches(): UseRecentSearchesResult {
  const [recent, setRecent] = useState<RecentSearch[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    setRecent(getStoredSearches());
  }, []);

  const addRecent = useCallback((search: Omit<RecentSearch, "timestamp">) => {
    setRecent((prev) => {
      // Remove existing entry for same user (if any)
      const filtered = prev.filter((s) => s.fid !== search.fid);

      // Add new entry at the beginning
      const newSearch: RecentSearch = {
        ...search,
        timestamp: Date.now(),
      };

      // Keep only MAX_ITEMS
      const updated = [newSearch, ...filtered].slice(0, MAX_ITEMS);

      // Persist to localStorage
      saveSearches(updated);

      return updated;
    });
  }, []);

  const removeRecent = useCallback((fid: number) => {
    setRecent((prev) => {
      const updated = prev.filter((s) => s.fid !== fid);
      saveSearches(updated);
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecent([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error("Failed to clear recent searches:", error);
      }
    }
  }, []);

  return {
    recent,
    addRecent,
    removeRecent,
    clearRecent,
  };
}
