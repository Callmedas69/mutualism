"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import type { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function PageWrapper({ children, title, subtitle }: PageWrapperProps) {
  const { isMiniApp } = useMiniApp();

  return (
    <div className={`mx-auto max-w-7xl px-4 pb-safe sm:px-6 lg:px-8 ${isMiniApp ? "py-2" : "py-6 sm:py-8"}`}>
      <div className={isMiniApp ? "mb-4" : "mb-8 sm:mb-10"}>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          {subtitle}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900 dark:text-white mt-1">
          {title}
        </h1>
      </div>
      {children}
    </div>
  );
}
