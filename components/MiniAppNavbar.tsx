"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Images, User, Wallet } from "lucide-react";
import { useAccount, useConnect } from "wagmi";
import { useMiniApp } from "@/hooks/useMiniApp";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gallery", label: "Gallery", icon: Images },
];

export default function MiniAppNavbar() {
  const pathname = usePathname();
  const { isMiniApp, user, viewProfile } = useMiniApp();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // Only show in miniapp mode
  if (!isMiniApp) return null;

  const handleWalletClick = () => {
    if (!isConnected) {
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    }
  };

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

        {/* Wallet button - connect or show address */}
        <button
          onClick={handleWalletClick}
          className={`flex flex-col items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-wide transition-colors ${
            isConnected
              ? "text-green-600 dark:text-green-400"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <Wallet size={20} strokeWidth={1.5} />
          <span className="font-medium">
            {isConnected && address
              ? `${address.slice(0, 4)}...${address.slice(-2)}`
              : "Wallet"}
          </span>
        </button>

        {/* Profile button - opens Farcaster profile */}
        {user && (
          <button
            onClick={() => viewProfile(user.fid)}
            className="flex flex-col items-center gap-1 px-3 py-2 text-[10px] uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {user.pfpUrl ? (
              <img
                src={user.pfpUrl}
                alt={user.username || "Profile"}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <User size={20} strokeWidth={1.5} />
            )}
            <span className="font-medium">Profile</span>
          </button>
        )}
      </div>

      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
