"use client";

import { Download } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  onExport: () => Promise<void>;
  disabled?: boolean;
}

export default function ExportButton({
  onExport,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className="flex items-center gap-1.5 border border-zinc-300 bg-white px-2 py-1.5 text-[9px] uppercase tracking-[0.1em] font-medium text-zinc-600 transition-all duration-200 hover:border-zinc-900 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-3 sm:py-2 sm:text-[10px] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-white dark:hover:text-white"
    >
      <Download size={12} />
      {isExporting ? "Exporting..." : "Export PNG"}
    </button>
  );
}
