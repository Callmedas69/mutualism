"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowLeftRight, Hexagon, User } from "lucide-react";
import { useMiniApp } from "@/hooks/useMiniApp";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/graph", label: "Graph", icon: ArrowLeftRight },
  { href: "/gallery", label: "Gallery", icon: Hexagon },
];

export default function MiniAppNavbar() {
  const pathname = usePathname();
  const { isMiniApp, user, viewProfile } = useMiniApp();

  // Only show in miniapp mode
  if (!isMiniApp) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-wide transition-colors ${
                isActive
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
