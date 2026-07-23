"use client";

import React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearFilterTabsProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  years?: number[];
  labelPrefix?: string; // e.g. "Participating Companies", "Speakers", "Sponsors", "Edition"
  showAllOption?: boolean;
  className?: string;
}

export default function YearFilterTabs({
  selectedYear,
  onYearChange,
  years = [2027, 2028, 2026, 2025, 2024],
  labelPrefix = "Edition",
  showAllOption = true,
  className,
}: YearFilterTabsProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted shrink-0">
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
        <span>EDITION FILTER:</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
        {years.map((year) => {
          const yearStr = String(year);
          const isActive = selectedYear === yearStr;
          return (
            <button
              key={year}
              type="button"
              onClick={() => onYearChange(yearStr)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap",
                isActive
                  ? "bg-primary-600 text-white shadow-primary-600/20 ring-2 ring-primary-500/30 scale-[1.02]"
                  : "bg-secondary-100 dark:bg-card-hover text-muted hover:text-foreground hover:bg-secondary-200"
              )}
            >
              <Calendar size={13} className={isActive ? "text-white" : "text-muted"} />
              {year} {labelPrefix ? labelPrefix : ""}
            </button>
          );
        })}

        {showAllOption && (
          <button
            type="button"
            onClick={() => onYearChange("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shadow-sm shrink-0 whitespace-nowrap",
              selectedYear === "all"
                ? "bg-foreground text-background"
                : "bg-secondary-100 dark:bg-card-hover text-muted hover:text-foreground"
            )}
          >
            All Years
          </button>
        )}
      </div>
    </div>
  );
}
