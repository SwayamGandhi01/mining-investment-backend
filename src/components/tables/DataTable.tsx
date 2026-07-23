"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import StatusToggle from "@/components/common/StatusToggle";
import EmptyState from "@/components/common/EmptyState";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T extends { _id: string; status?: string; isActive?: boolean }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  total: number;
  page: number;
  limit: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onSortChange: (sort: string, order: "asc" | "desc") => void;
  onSearchChange: (search: string) => void;
  onStatusToggle?: (id: string, newStatus: boolean | string) => void;
  onBulkDelete?: (selectedIds: string[]) => void;
  onDelete?: (id: string) => void;
  actions?: (item: T) => React.ReactNode;
}

export default function DataTable<T extends { _id: string; status?: string; isActive?: boolean }>({
  columns,
  data,
  loading = false,
  total,
  page,
  limit,
  sort,
  order,
  search = "",
  onPageChange,
  onLimitChange,
  onSortChange,
  onSearchChange,
  onStatusToggle,
  onBulkDelete,
  actions,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map((item) => item._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSort = (key: string) => {
    if (sort === key) {
      onSortChange(key, order === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Search & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          />
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && onBulkDelete && (
          <div className="flex items-center gap-2 animate-fade-in w-full sm:w-auto justify-end">
            <span className="text-xs text-muted">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => {
                onBulkDelete(selectedIds);
                setSelectedIds([]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-danger-50 hover:bg-danger-100 text-danger-600 dark:bg-danger-500/10 dark:hover:bg-danger-500/20 dark:text-danger-500 rounded-lg text-xs font-medium transition-colors"
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-card-hover border-b border-border text-muted font-medium text-xs uppercase tracking-wider">
                {onBulkDelete && (
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        data.length > 0 && selectedIds.length === data.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                )}

                {columns.map((col, idx) => (
                  <th key={idx} className="p-4">
                    {col.sortable && col.accessorKey ? (
                      <button
                        onClick={() => handleSort(String(col.accessorKey))}
                        className="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
                      >
                        {col.header}
                        {sort === col.accessorKey ? (
                          order === "asc" ? (
                            <ArrowUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )
                        ) : (
                          <ArrowUpDown size={14} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}

                {onStatusToggle && <th className="p-4 w-24">Status</th>}
                {actions && <th className="p-4 w-20 text-right">Actions</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (onBulkDelete ? 1 : 0) +
                      (onStatusToggle ? 1 : 0) +
                      (actions ? 1 : 0)
                    }
                    className="p-8 text-center"
                  >
                    <LoadingSpinner text="Loading records..." />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      columns.length +
                      (onBulkDelete ? 1 : 0) +
                      (onStatusToggle ? 1 : 0) +
                      (actions ? 1 : 0)
                    }
                    className="p-4"
                  >
                    <EmptyState />
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item._id}
                    className={cn(
                      "hover:bg-card-hover/50 transition-colors",
                      selectedIds.includes(item._id) && "bg-primary-50/50 dark:bg-primary-900/10"
                    )}
                  >
                    {onBulkDelete && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item._id)}
                          onChange={() => handleSelectOne(item._id)}
                          className="rounded border-border text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}

                    {columns.map((col, idx) => (
                      <td key={idx} className="p-4 text-foreground font-normal">
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String(item[col.accessorKey as keyof T] ?? "-")
                          : "-"}
                      </td>
                    ))}

                    {onStatusToggle && (
                      <td className="p-4">
                        <StatusToggle
                          checked={
                            item.status === "published" ||
                            item.status === "active" ||
                            item.isActive === true
                          }
                          onChange={(val) => {
                            const newStatus = typeof item.status === "string"
                              ? val ? "published" : "draft"
                              : val;
                            onStatusToggle(item._id, newStatus);
                          }}
                          size="sm"
                        />
                      </td>
                    )}

                    {actions && (
                      <td className="p-4 text-right">{actions(item)}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-card-hover/30 text-xs text-muted">
          {/* Items per page */}
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-card border border-border rounded px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              {[10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>
              Showing {data.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
              {Math.min(page * limit, total)} of {total} entries
            </span>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-card border border-border disabled:opacity-30 transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-1.5 rounded hover:bg-card border border-border disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 font-medium text-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-card border border-border disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-card border border-border disabled:opacity-30 transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
