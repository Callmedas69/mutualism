"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { useUserSearch, type SearchUser } from "@/hooks/useUserSearch";

interface UserAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (user: SearchUser) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function UserAutocomplete({
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = "@username",
}: UserAutocompleteProps) {
  const { results, loading, search, clear } = useUserSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Search when value changes (3+ chars to reduce API calls)
  useEffect(() => {
    if (value.length >= 3) {
      search(value);
      setIsOpen(true);
    } else {
      clear();
      setIsOpen(false);
    }
  }, [value, search, clear]);

  // Reset highlighted index when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (user: SearchUser) => {
      onChange(user.username);
      onSelect(user);
      setIsOpen(false);
      clear();
    },
    [onChange, onSelect, clear]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || results.length === 0) {
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < results.length) {
            handleSelect(results[highlightedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, results, highlightedIndex, handleSelect]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  const showDropdown = isOpen && (results.length > 0 || loading);

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 pointer-events-none" />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 animate-spin" />
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 3 && results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-label="Search username"
        aria-expanded={showDropdown}
        aria-haspopup="listbox"
        aria-controls="user-search-listbox"
        aria-activedescendant={
          highlightedIndex >= 0 ? `user-option-${highlightedIndex}` : undefined
        }
        autoComplete="off"
        className="w-full border border-zinc-200 bg-white py-3 pl-10 pr-10 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white"
      />

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          id="user-search-listbox"
          role="listbox"
          aria-label="Search results"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {loading && results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              Searching...
            </li>
          ) : (
            results.map((user, index) => (
              <li
                key={user.fid}
                id={`user-option-${index}`}
                role="option"
                aria-selected={highlightedIndex === index}
                onClick={() => handleSelect(user)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`min-h-[44px] flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                  highlightedIndex === index
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  {user.pfp_url && (
                    <Image
                      src={user.pfp_url}
                      alt={user.username}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                    @{user.username}
                  </p>
                  {user.display_name && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {user.display_name}
                    </p>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
