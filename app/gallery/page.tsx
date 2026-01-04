"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { ExternalLink, Coins, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";
import { getCoinUrl } from "@/lib/zora";
import { TransitionLink } from "@/components/TransitionLink";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAllCoins, type CoinWithCreator } from "@/hooks/useAllCoins";
import { useCoinStats, type CoinStats } from "@/hooks/useCoinStats";
import { useMiniApp } from "@/hooks/useMiniApp";

const PAGE_SIZE = 10;

export default function GalleryPage() {
  const { signalReady, isMiniApp } = useMiniApp();
  const { address: connectedAddress } = useAccount();
  const [page, setPage] = useState(0);

  // Query all coins from on-chain registry with pagination
  const { coins, total, totalPages, isLoading: isRegistryLoading, error: registryError } = useAllCoins(page, PAGE_SIZE);

  // Signal to Farcaster that the app is ready
  useEffect(() => {
    signalReady();
  }, [signalReady]);

  // Extract coin addresses for stats query
  const coinAddresses = useMemo(() => coins.map((c) => c.coin), [coins]);

  // Fetch live stats for all coins
  const { data: coinStats, isLoading: isStatsLoading, error: statsError } = useCoinStats(coinAddresses);

  // Create a map of stats by address for quick lookup
  const statsMap = useMemo(() => {
    const map = new Map<string, CoinStats>();
    coinStats?.forEach((stat) => {
      map.set(stat.address.toLowerCase(), stat);
    });
    return map;
  }, [coinStats]);

  const isLoading = isRegistryLoading;
  const hasCoins = coins.length > 0;
  const hasError = !!registryError || !!statsError;

  // Loading state with shimmer
  if (isLoading) {
    return (
      <div className={`mx-auto max-w-7xl px-4 pb-safe sm:px-6 lg:px-8 ${isMiniApp ? "py-2" : "py-6 sm:py-8"}`}>
        <div className="mb-8 sm:mb-10">
          <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
          <div className="mt-2 h-8 w-48 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50">
              <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
                <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-7xl px-4 pb-safe sm:px-6 lg:px-8 ${isMiniApp ? "py-2" : "py-6 sm:py-8"}`}>
      {/* Header */}
      <div className={isMiniApp ? "mb-4" : "mb-8 sm:mb-10"}>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Tokenized Social Graphs
        </p>
        <div className="flex items-baseline gap-3 mt-1">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
            Gallery
          </h1>
          {total > 0 && (
            <span className="text-sm text-zinc-400">
              {total} coin{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {hasError && (
          <p className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle size={14} />
            {registryError ? "Failed to load coins from registry" : "Failed to load coin stats"}
          </p>
        )}
      </div>

      {/* Empty State */}
      {!hasCoins && !hasError && (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
          <Coins className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Nothing Here Yet
          </p>
          <h3 className="mt-2 text-xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white">
            No tokens created
          </h3>
          <p className="mt-3 text-sm uppercase tracking-[0.05em] text-zinc-500 dark:text-zinc-400">
            Be the first to tokenize your social graph
          </p>
          <TransitionLink
            href="/graph"
            className="mt-6 inline-block px-6 py-3 text-xs uppercase tracking-[0.15em] font-medium border border-zinc-900 text-zinc-900 transition-all duration-200 hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-900"
          >
            Go to Graph
          </TransitionLink>
        </div>
      )}

      {/* Coins List */}
      {hasCoins && (
        <ErrorBoundary name="GalleryList">
        <div className="space-y-2">
          {/* Header Row */}
          <div className="flex items-center gap-4 px-4 text-[10px] uppercase tracking-wider text-zinc-400">
            <div className="h-10 w-10 shrink-0" /> {/* Spacer for icon */}
            <div className="min-w-0 flex-1">Coin</div>
            <div className="w-16 text-center">Holders</div>
            <div className="w-16 text-center">24h</div>
            <div className="w-20 text-right">Cap</div>
            <div className="w-[14px] shrink-0" /> {/* Spacer for link icon */}
          </div>
          {/* Coin Cards */}
          <div className="space-y-2">
            {coins.map((coinData) => (
              <CoinCard
                key={coinData.coin}
                coinData={coinData}
                stats={statsMap.get(coinData.coin.toLowerCase())}
                isStatsLoading={isStatsLoading}
                isOwner={coinData.creator.toLowerCase() === connectedAddress?.toLowerCase()}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="flex items-center gap-1 px-3 py-2 text-xs uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="text-xs text-zinc-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="flex items-center gap-1 px-3 py-2 text-xs uppercase tracking-wider border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        </ErrorBoundary>
      )}
    </div>
  );
}

interface CoinCardProps {
  coinData: CoinWithCreator;
  stats?: CoinStats;
  isStatsLoading: boolean;
  isOwner: boolean;
}

const CoinCard = memo(function CoinCard({ coinData, stats, isStatsLoading, isOwner }: CoinCardProps) {
  const { coin: address, creator } = coinData;
  const coinUrl = getCoinUrl(address);

  const name = stats?.name || "Unknown Coin";
  const symbol = stats?.symbol || "???";
  const holders = stats?.uniqueHolders || 0;

  const formatMarketCap = (value: string | undefined) => {
    if (!value || value === "0") return "—";
    const num = parseFloat(value);
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
    return `$${num.toFixed(0)}`;
  };

  const priceChange = parseFloat(stats?.priceChange24h || "0");
  const isPositive = priceChange > 0;
  const isNegative = priceChange < 0;

  return (
    <a
      href={coinUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 p-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 transition-all duration-300 ease-out hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-0.5"
    >
      {/* Icon */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
        <Coins className="h-5 w-5 text-purple-600 dark:text-purple-400" />
      </div>

      {/* Name, Symbol & Creator */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium uppercase tracking-wide text-zinc-900 dark:text-white">
            {name}
          </p>
          {isOwner && (
            <span className="shrink-0 px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
          <span className="font-mono">${symbol}</span>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          {isOwner ? (
            <span className="font-mono text-[10px]">{address.slice(0, 6)}...{address.slice(-4)}</span>
          ) : (
            <span className="font-mono text-[10px]">by {creator.slice(0, 6)}...{creator.slice(-4)}</span>
          )}
        </div>
      </div>

      {/* Stats */}
      {isStatsLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      ) : (
        <>
          {/* Holders */}
          <div className="w-16 text-center text-xs text-zinc-600 dark:text-zinc-400">
            {holders}
          </div>
          {/* 24h Change */}
          <div
            className={`w-16 text-center text-xs ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : isNegative
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-400"
            }`}
          >
            {priceChange !== 0 ? `${isPositive ? "+" : ""}${priceChange.toFixed(1)}%` : "—"}
          </div>
          {/* Market Cap */}
          <div className="w-20 text-right text-xs text-zinc-600 dark:text-zinc-400">
            {formatMarketCap(stats?.marketCap)}
          </div>
        </>
      )}

      {/* External Link Icon */}
      <ExternalLink size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
    </a>
  );
});

CoinCard.displayName = "CoinCard";
