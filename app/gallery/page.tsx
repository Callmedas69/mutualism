"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ExternalLink, Coins, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";
import { getCoinUrl } from "@/lib/zora";
import { TransitionLink } from "@/components/TransitionLink";
import ErrorBoundary from "@/components/ErrorBoundary";
import GallerySkeleton from "@/components/gallery/GallerySkeleton";
import { useAllCoins, type CoinWithCreator } from "@/hooks/useAllCoins";
import { useCoinStats, type CoinStats } from "@/hooks/useCoinStats";
import { useMiniApp } from "@/hooks/useMiniApp";

const PAGE_SIZE = 10;

export default function GalleryPage() {
  const router = useRouter();
  const { signalReady, isMiniApp } = useMiniApp();
  const { address: connectedAddress } = useAccount();
  const [page, setPage] = useState(0);

  // Mini App Simplification: Redirect to graph (only destination)
  useEffect(() => {
    if (isMiniApp) {
      router.replace("/graph");
    }
  }, [isMiniApp, router]);

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
    return <GallerySkeleton />;
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
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 sm:p-12 text-center">
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
            className="mt-6 inline-block w-full sm:w-auto px-6 py-3 text-xs uppercase tracking-[0.15em] font-medium border border-zinc-900 text-zinc-900 transition-all duration-200 hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-900"
          >
            Go to Graph
          </TransitionLink>
        </div>
      )}

      {/* Coins Grid */}
      {hasCoins && (
        <ErrorBoundary name="GalleryList">
        <div className="space-y-6">
          {/* Coin Cards Grid */}
          <div className="grid gap-3 sm:grid-cols-2">
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
            <div className="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800/50 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-center text-xs uppercase tracking-[0.1em] text-zinc-500 sm:text-left dark:text-zinc-400">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex items-center justify-center gap-0">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="flex items-center gap-1 px-5 py-2.5 min-h-[44px] text-xs uppercase tracking-[0.1em] font-medium border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-white dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-300 disabled:hover:text-zinc-600 dark:disabled:hover:border-zinc-700 dark:disabled:hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                {/* Mobile page indicator */}
                <span className="px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-zinc-500 border-y border-zinc-300 dark:border-zinc-700 sm:hidden dark:text-zinc-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="flex items-center gap-1 px-5 py-2.5 min-h-[44px] text-xs uppercase tracking-[0.1em] font-medium border border-l-0 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-white dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-300 disabled:hover:text-zinc-600 dark:disabled:hover:border-zinc-700 dark:disabled:hover:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
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
  const image = stats?.image || "";

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
      className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 transition-all duration-300 ease-out hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
    >
      {/* Image */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            sizes="40px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Coins className="h-5 w-5 text-zinc-400" />
          </div>
        )}
      </div>

      {/* Name, Symbol & Creator */}
      <div className="min-w-0 flex-1 overflow-hidden">
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
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-500">
          <span className="font-mono">${symbol}</span>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">|</span>
          <span className="font-mono text-[11px]">
            {isOwner ? `${address.slice(0, 6)}...${address.slice(-4)}` : `by ${creator.slice(0, 6)}...${creator.slice(-4)}`}
          </span>
        </p>
      </div>

      {/* Stats - Market Cap + 24h Change stacked */}
      {isStatsLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      ) : (
        <div className="flex flex-col items-end shrink-0">
          {/* Market Cap - always visible */}
          <span className="text-xs font-medium text-zinc-900 dark:text-white">
            {formatMarketCap(stats?.marketCap)}
          </span>
          {/* 24h Change */}
          <span
            className={`text-[10px] ${
              isPositive
                ? "text-green-600 dark:text-green-400"
                : isNegative
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-400"
            }`}
          >
            {priceChange !== 0 ? `${isPositive ? "+" : ""}${priceChange.toFixed(1)}%` : "—"}
          </span>
        </div>
      )}

      {/* External Link Icon */}
      <ExternalLink size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
    </a>
  );
});

CoinCard.displayName = "CoinCard";
