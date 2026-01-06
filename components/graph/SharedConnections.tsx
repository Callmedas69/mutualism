"use client";

import { useState, FormEvent, memo, useCallback, useEffect } from "react";
import Image from "next/image";
import { Loader2, Users, UserCheck, AlertCircle, Clock, Search } from "lucide-react";
import { useFarcasterUser } from "@/context/FarcasterProvider";
import { useMiniApp } from "@/hooks/useMiniApp";
import { useSharedConnections } from "@/hooks/useSharedConnections";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import type { SharedMutualUser } from "@/types/quotient";
import type { SearchUser } from "@/hooks/useUserSearch";
import { URLS } from "@/lib/constants";
import UserAutocomplete from "./UserAutocomplete";

interface SharedUserItemProps {
  user: SharedMutualUser;
  rank: number;
  onProfileClick?: (fid: number) => void;
}

const SharedUserItem = memo(function SharedUserItem({
  user,
  rank,
  onProfileClick,
}: SharedUserItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onProfileClick) {
      e.preventDefault();
      onProfileClick(user.fid);
    }
  };

  return (
    <a
      href={`${URLS.warpcast}/${user.username}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="group flex items-center gap-4 p-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 transition-all duration-300 ease-out hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
        <p className="truncate text-sm font-medium uppercase tracking-wide text-zinc-900 dark:text-white">
          @{user.username}
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-500">
          <span className="font-mono">#{rank}</span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span>You: {user.combined_score.toFixed(1)}</span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <span>Them: {user.target_combined_score.toFixed(1)}</span>
        </div>
      </div>
    </a>
  );
});

SharedUserItem.displayName = "SharedUserItem";

export default function SharedConnections() {
  const { user } = useFarcasterUser();
  const { isMiniApp, viewProfile } = useMiniApp();
  const { result, loading, error, search, clear } = useSharedConnections(
    user?.fid
  );
  const { recent, addRecent } = useRecentSearches();
  const [inputValue, setInputValue] = useState("");

  // Save successful search to recent
  useEffect(() => {
    if (result?.target) {
      addRecent({
        username: result.target.username,
        pfp_url: result.target.pfp_url,
        fid: result.target.fid,
      });
    }
  }, [result, addRecent]);

  // Handle profile clicks - use SDK in miniapp, fallback to default link behavior
  const handleProfileClick = useCallback(
    (fid: number) => {
      if (isMiniApp) {
        viewProfile(fid);
      }
    },
    [isMiniApp, viewProfile]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      search(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue("");
    clear();
  };

  const handleRecentClick = (username: string) => {
    setInputValue(username);
    search(username);
  };

  const handleAutocompleteSelect = (selectedUser: SearchUser) => {
    setInputValue(selectedUser.username);
    search(selectedUser.username);
  };

  if (!user) {
    return (
      <div className="flex min-h-[30vh] flex-col items-center justify-center gap-4 py-12">
        <div className="h-16 w-16 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
          <Users className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
        </div>
        <div className="text-center max-w-sm">
          <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-900 dark:text-white">
            Login Required
          </h3>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Connect your Farcaster account to find warm introductions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <UserAutocomplete
          value={inputValue}
          onChange={setInputValue}
          onSelect={handleAutocompleteSelect}
          disabled={loading}
          placeholder="@username"
        />
        <button
          type="submit"
          disabled={loading || !inputValue.trim()}
          aria-label="Search for connections"
          className="px-6 py-3 text-xs uppercase tracking-[0.1em] font-medium bg-zinc-900 text-white transition-all duration-200 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Search"
          )}
        </button>
        {(result || error) && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="px-4 py-3 text-xs uppercase tracking-[0.1em] font-medium border border-zinc-200 text-zinc-600 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
          >
            Clear
          </button>
        )}
      </form>

      {/* Recent Searches - show when no results and has recent searches */}
      {!result && !error && !loading && recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Clock className="h-3 w-3" />
            <span>Recent:</span>
          </div>
          {recent.map((item) => (
            <button
              key={item.fid}
              onClick={() => handleRecentClick(item.username)}
              className="min-h-[44px] flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-zinc-100 text-zinc-700 rounded-full transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {item.pfp_url && (
                <Image
                  src={item.pfp_url}
                  alt={item.username}
                  width={16}
                  height={16}
                  className="rounded-full"
                  unoptimized
                />
              )}
              <span>@{item.username}</span>
            </button>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-400">
            {error.message}
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Target User Card */}
          <div className="border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                {result.target.pfp_url && (
                  <Image
                    src={result.target.pfp_url}
                    alt={result.target.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium uppercase tracking-wide text-zinc-900 dark:text-white">
                  @{result.target.username}
                </p>
                {result.target.display_name && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {result.target.display_name}
                  </p>
                )}
              </div>
              {isMiniApp ? (
                <button
                  onClick={() => viewProfile(result.target.fid)}
                  aria-label={`View ${result.target.username} profile`}
                  className="min-h-[44px] px-4 py-2 text-[10px] uppercase tracking-[0.1em] font-medium border border-zinc-300 text-zinc-600 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
                >
                  View Profile
                </button>
              ) : (
                <a
                  href={`${URLS.warpcast}/${result.target.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${result.target.username} profile on Warpcast`}
                  className="min-h-[44px] flex items-center px-4 py-2 text-[10px] uppercase tracking-[0.1em] font-medium border border-zinc-300 text-zinc-600 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
                >
                  View Profile
                </a>
              )}
            </div>
          </div>

          {/* Already Connected Notice */}
          {result.userAlreadyKnowsTarget && (
            <div className="flex items-center gap-3 border border-green-200 bg-green-50 p-4 dark:border-green-800/50 dark:bg-green-900/20">
              <UserCheck className="h-5 w-5 shrink-0 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-400">
                You already know this person! They&apos;re in your mutuals.
              </p>
            </div>
          )}

          {/* Shared Connections Count */}
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            <p className="text-xs uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
              {result.count === 0
                ? "No shared connections found"
                : `You both know ${result.count} ${result.count === 1 ? "person" : "people"}`}
            </p>
          </div>

          {/* Shared Connections List */}
          {result.shared.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.shared.slice(0, 20).map((user, index) => (
                <SharedUserItem
                  key={user.fid}
                  user={user}
                  rank={index + 1}
                  onProfileClick={isMiniApp ? handleProfileClick : undefined}
                />
              ))}
            </div>
          )}

          {/* No Shared Connections */}
          {result.count === 0 && !result.userAlreadyKnowsTarget && (
            <div className="flex min-h-[20vh] flex-col items-center justify-center gap-4 py-8">
              <div className="h-12 w-12 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                <Users className="h-6 w-6 text-zinc-400 dark:text-zinc-600" />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  No mutual connections between you and @{result.target.username}.
                  Try searching for someone else.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!result && !error && !loading && (
        <div className="flex min-h-[20vh] flex-col items-center justify-center gap-4 py-8">
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
            <Search className="h-8 w-8 text-zinc-400 dark:text-zinc-600" />
          </div>
          <div className="text-center max-w-sm">
            <h3 className="text-sm font-medium uppercase tracking-wide text-zinc-900 dark:text-white">
              Find Warm Intros
            </h3>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Search for someone you want to meet. We'll show you who knows both of you.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
