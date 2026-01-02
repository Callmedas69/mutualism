"use client";

import { useMiniApp } from "@/hooks/useMiniApp";
import type { ReactNode } from "react";

export default function MainContent({ children }: { children: ReactNode }) {
  const { isMiniApp } = useMiniApp();

  return (
    <main className={isMiniApp ? "pb-20 pt-2" : "pb-20 pt-16"}>
      {children}
    </main>
  );
}
