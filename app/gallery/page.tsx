"use client";

import { useEffect, useState, useMemo } from "react";
import { ExternalLink, Coins, TrendingUp, TrendingDown, Users, BarChart3, Loader2, Wallet, AlertCircle } from "lucide-react";
import { getCreatedCoins, type CreatedCoin } from "@/lib/storage";
import { getCoinUrl } from "@/lib/zora";
import { TransitionLink } from "@/components/TransitionLink";
import { useCreatorCoins } from "@/hooks/useCreatorCoins";
import { useCoinStats, type CoinStats } from "@/hooks/useCoinStats";
import { useMiniApp } from "@/hooks/useMiniApp";
import { REGISTRY_ADDRESS } from "@/lib/registry";

export default function GalleryPage() {
  const [localCoins, setLocalCoins] = useState<CreatedCoin[]>([]);
  const [mounted, setMounted] = useState(false);
  const { signalReady } = useMiniApp();

  // Query coins from on-chain registry
  const { coinAddresses, isLoading: isRegistryLoading, isConnected, error: registryError } = useCreatorCoins();

  // Signal to Farcaster that the app is ready
  useEffect(() => {
    signalReady();
  }, [signalReady]);

  // Merge registry coins with localStorage (for migration)
  const allAddresses = useMemo(() => {
    const registryAddrs = coinAddresses || [];
    const localAddrs = localCoins.map((c) => c.coinAddress);
    // Combine and deduplicate
    const combined = [...new Set([...registryAddrs, ...localAddrs])];
    return combined;
  }, [coinAddresses, localCoins]);

  // Fetch live stats for all coins
  const { data: coinStats, isLoading: isStatsLoading, error: statsError } = useCoinStats(allAddresses);

  // Create a map of stats by address for quick lookup
  const statsMap = useMemo(() => {
    const map = new Map<string, CoinStats>();
    coinStats?.forEach((stat) => {
      map.set(stat.address.toLowerCase(), stat);
    });
    return map;
  }, [coinStats]);

  // Create a map of local coin data by address
  const localCoinMap = useMemo(() => {
    const map = new Map<string, CreatedCoin>();
    localCoins.forEach((coin) => {
      map.set(coin.coinAddress.toLowerCase(), coin);
    });
    return map;
  }, [localCoins]);

  useEffect(() => {
    setMounted(true);
    // Load localStorage coins for migration/fallback
    setLocalCoins(getCreatedCoins());
  }, []);

  const isLoading = !mounted || isRegistryLoading;
  const hasCoins = allAddresses.length > 0;
  const hasError = !!registryError || !!statsError;

  // Loading state with shimmer
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 pb-safe sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-8 sm:mb-10">
          <div className="h-3 w-32 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
          <div className="mt-2 h-8 w-48 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 p-4">
              <div className="h-5 w-32 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              <div className="mt-2 h-4 w-20 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
                <div className="h-16 bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-safe sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Tokenized Social Graphs
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
          Your Gallery
        </h1>
        {!isConnected && (
          <p className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <Wallet size={14} />
            Connect wallet to see all your coins
          </p>
        )}
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
            Tokenize your first social graph from the dashboard
          </p>
          <TransitionLink
            href="/dashboard"
            className="mt-6 inline-block px-6 py-3 text-xs uppercase tracking-[0.15em] font-medium border border-zinc-900 text-zinc-900 transition-all duration-200 hover:bg-zinc-900 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-zinc-900"
          >
            Go to Dashboard
          </TransitionLink>
        </div>
      )}

      {/* Coins Grid */}
      {hasCoins && (
        <div className="grid gap-3 sm:grid-cols-2">
          {allAddresses.map((address) => (
            <CoinCard
              key={address}
              address={address}
              stats={statsMap.get(address.toLowerCase())}
              localData={localCoinMap.get(address.toLowerCase())}
              isStatsLoading={isStatsLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CoinCardProps {
  address: string;
  stats?: CoinStats;
  localData?: CreatedCoin;
  isStatsLoading: boolean;
}

function CoinCard({ address, stats, localData, isStatsLoading }: CoinCardProps) {
  const coinUrl = getCoinUrl(address as `0x${string}`);

  // Use stats data if available, fall back to local data
  const name = stats?.name || localData?.name || "Unknown Coin";
  const symbol = stats?.symbol || localData?.symbol || "???";

  // Format market cap (convert from raw string to readable)
  const formatMarketCap = (value: string | undefined) => {
    if (!value || value === "0") return "—";
    const num = parseFloat(value);
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Format volume
  const formatVolume = (value: string | undefined) => {
    if (!value || value === "0") return "—";
    const num = parseFloat(value);
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Format price change
  const priceChange = parseFloat(stats?.priceChange24h || "0");
  const isPositive = priceChange > 0;
  const isNegative = priceChange < 0;

  return (
    <div className="group border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 p-4 transition-all duration-300 ease-out hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-0.5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm uppercase tracking-[0.1em] font-semibold text-zinc-900 dark:text-white">
            {name}
          </h3>
          <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            ${symbol}
          </p>
        </div>
        <a
          href={coinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          title="View on Zora"
        >
          <ExternalLink size={16} />
        </a>
      </div>

      {/* Stats Grid */}
      {isStatsLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Market Cap */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <BarChart3 size={12} />
              <span className="text-[10px] uppercase tracking-wider">Market Cap</span>
            </div>
            <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
              {formatMarketCap(stats?.marketCap)}
            </p>
          </div>

          {/* 24h Volume */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <TrendingUp size={12} />
              <span className="text-[10px] uppercase tracking-wider">24h Volume</span>
            </div>
            <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
              {formatVolume(stats?.volume24h)}
            </p>
          </div>

          {/* Holders */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Users size={12} />
              <span className="text-[10px] uppercase tracking-wider">Holders</span>
            </div>
            <p className="font-mono text-sm font-semibold text-zinc-900 dark:text-white">
              {stats?.uniqueHolders || "—"}
            </p>
          </div>

          {/* 24h Change */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span className="text-[10px] uppercase tracking-wider">24h Change</span>
            </div>
            <p
              className={`font-mono text-sm font-semibold ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : isNegative
                  ? "text-red-600 dark:text-red-400"
                  : "text-zinc-900 dark:text-white"
              }`}
            >
              {priceChange !== 0 ? (
                <>
                  {isPositive ? "+" : ""}
                  {priceChange.toFixed(2)}%
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>
      )}

      {/* Local data fallback info */}
      {localData && !stats && (
        <div className="mt-3 space-y-1 text-xs text-zinc-400">
          <div className="flex justify-between uppercase tracking-[0.05em]">
            <span>Graph Type</span>
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              {localData.graphType}
            </span>
          </div>
          <div className="flex justify-between uppercase tracking-[0.05em]">
            <span>Connections</span>
            <span className="font-mono font-medium text-zinc-600 dark:text-zinc-300">
              {localData.nodeCount}
            </span>
          </div>
        </div>
      )}

      {/* Contract Address */}
      <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          {address.slice(0, 10)}...{address.slice(-8)}
        </p>
      </div>
    </div>
  );
}
