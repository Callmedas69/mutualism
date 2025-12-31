"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Coins } from "lucide-react";
import { getCreatedCoins, type CreatedCoin } from "@/lib/storage";
import { getCoinUrl } from "@/lib/zora";
import { TransitionLink } from "@/components/TransitionLink";

export default function GalleryPage() {
  const [coins, setCoins] = useState<CreatedCoin[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCoins(getCreatedCoins());
  }, []);

  // Loading state with shimmer
  if (!mounted) {
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
              <div className="mt-4 space-y-2">
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
                <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 skeleton-shimmer" />
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
      </div>

      {/* Empty State */}
      {coins.length === 0 && (
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
      {coins.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {coins.map((coin) => (
            <CoinCard key={coin.coinAddress} coin={coin} />
          ))}
        </div>
      )}
    </div>
  );
}

function CoinCard({ coin }: { coin: CreatedCoin }) {
  const coinUrl = getCoinUrl(coin.coinAddress);
  const createdDate = new Date(coin.createdAt).toLocaleDateString();

  return (
    <div className="group border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-zinc-900/50 p-4 transition-all duration-300 ease-out hover:border-zinc-200 dark:hover:border-zinc-700 hover:-translate-y-0.5">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm uppercase tracking-[0.1em] font-semibold text-zinc-900 dark:text-white">
            {coin.name}
          </h3>
          <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            ${coin.symbol}
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

      {/* Details */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between uppercase tracking-[0.05em]">
          <span className="text-zinc-400">Graph Type</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {coin.graphType}
          </span>
        </div>
        <div className="flex justify-between uppercase tracking-[0.05em]">
          <span className="text-zinc-400">Connections</span>
          <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
            {coin.nodeCount}
          </span>
        </div>
        <div className="flex justify-between uppercase tracking-[0.05em]">
          <span className="text-zinc-400">Created</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{createdDate}</span>
        </div>
      </div>

      {/* Contract Address */}
      <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800/50 pt-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
          {coin.coinAddress.slice(0, 10)}...{coin.coinAddress.slice(-8)}
        </p>
      </div>
    </div>
  );
}
