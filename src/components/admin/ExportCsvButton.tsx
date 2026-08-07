"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";

interface ExportCsvButtonProps {
  /** Export endpoint, e.g. "/api/subscribers/export". */
  endpoint: string;
  /** Current search box contents, so the export matches what is on screen. */
  search?: string;
  /** Current sort column and direction. */
  sort?: string;
  order?: "asc" | "desc";
  /** Extra query parameters (year, status, …). Empty values are dropped. */
  params?: Record<string, string | undefined>;
  /** Row count shown in the confirmation toast. */
  total?: number;
  label?: string;
}

/**
 * Downloads a list as CSV.
 *
 * Fetches rather than using a plain <a download> so a failure surfaces as a
 * toast instead of the browser quietly saving an error page as a .csv file.
 */
export default function ExportCsvButton({
  endpoint,
  search,
  sort,
  order,
  params,
  total,
  label = "Export CSV",
}: ExportCsvButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (sort) query.set("sort", sort);
      if (order) query.set("order", order);
      for (const [key, value] of Object.entries(params ?? {})) {
        if (value) query.set(key, value);
      }

      const url = query.toString() ? `${endpoint}?${query}` : endpoint;
      const res = await fetch(url, { credentials: "same-origin" });

      if (!res.ok) {
        // Error responses are JSON, not CSV.
        const message = await res
          .json()
          .then((b) => b.message)
          .catch(() => null);
        throw new Error(message || `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      if (blob.size === 0) throw new Error("The export came back empty");

      // Prefer the filename the server chose; it carries the date stamp.
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const fileName = match?.[1] || "export.csv";

      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);

      const truncated = res.headers.get("x-export-truncated");
      if (truncated) {
        toast.warning(
          `Export capped at ${Number(truncated).toLocaleString()} rows — narrow the search to get the rest.`
        );
      } else {
        toast.success(
          typeof total === "number" ? `Exported ${total} record${total === 1 ? "" : "s"}` : "Export downloaded"
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting || total === 0}
      title={total === 0 ? "Nothing to export yet" : `Download ${label.replace("Export ", "")}`}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-border bg-card hover:bg-card-hover text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {exporting ? "Exporting..." : label}
    </button>
  );
}
