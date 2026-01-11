"use client";

import { memo } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MutualUser, ConnectionUser } from "@/types/quotient";
import { useMiniAppContext } from "@/context/MiniAppProvider";
import { URLS } from "@/lib/constants";

const INITIAL_COUNT = 5;

interface CompactConnectionListProps {
  connections: (MutualUser | ConnectionUser)[];
  type: "mutual" | "influence";
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function isMutualUser(user: MutualUser | ConnectionUser): user is MutualUser {
  return "combined_score" in user;
}

function getScore(user: MutualUser | ConnectionUser): number {
  return isMutualUser(user) ? user.combined_score : user.score;
}

function getMaxScore(connections: (MutualUser | ConnectionUser)[]): number {
  if (connections.length === 0) return 1;
  return Math.max(...connections.map(getScore));
}

interface CompactItemProps {
  user: MutualUser | ConnectionUser;
  maxScore: number;
  onViewProfile?: (fid: number) => void;
}

const CompactItem = memo(function CompactItem({ user, maxScore, onViewProfile }: CompactItemProps) {
  const score = getScore(user);
  const barWidth = (score / maxScore) * 100;

  const handleClick = () => {
    if (onViewProfile) {
      onViewProfile(user.fid);
    } else {
      window.open(`${URLS.warpcast}/${user.username}`, "_blank");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex w-full items-center gap-3 py-2 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
    >
      {/* Rank */}
      <span className="w-5 shrink-0 text-xs font-mono text-zinc-400">
        {user.rank}
      </span>

      {/* Avatar */}
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-100">
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

      {/* Username + Score Bar */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900">
          @{user.username}
        </p>
        <div className="mt-1 flex items-center gap-2">
          {/* Score bar */}
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          {/* Score value */}
          <span className="shrink-0 text-[10px] font-mono text-zinc-400">
            {score.toFixed(1)}
          </span>
        </div>
      </div>
    </button>
  );
});

CompactItem.displayName = "CompactItem";

export default function CompactConnectionList({
  connections,
  type,
  title,
  isExpanded,
  onToggle,
}: CompactConnectionListProps) {
  const { viewProfile } = useMiniAppContext();

  if (connections.length === 0) {
    return null;
  }

  const displayedConnections = isExpanded
    ? connections
    : connections.slice(0, INITIAL_COUNT);
  const hasMore = connections.length > INITIAL_COUNT;
  const maxScore = getMaxScore(connections);

  const handleViewProfile = viewProfile
    ? (fid: number) => viewProfile(fid)
    : undefined;

  return (
    <div className="border-t border-zinc-100 pt-4">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">
          {title}
        </h3>
        <span className="text-[10px] text-zinc-400">
          {connections.length}
        </span>
      </div>

      {/* List */}
      <div className="space-y-0">
        {displayedConnections.map((user) => (
          <CompactItem
            key={user.fid}
            user={user}
            maxScore={maxScore}
            onViewProfile={handleViewProfile}
          />
        ))}
      </div>

      {/* See all / Collapse */}
      {hasMore && (
        <button
          onClick={onToggle}
          className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-xs font-medium uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-900"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <span>See all {connections.length}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
