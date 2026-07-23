"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, CalendarDays, MapPin } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import YearFilterTabs from "@/components/common/YearFilterTabs";

interface BrochureItem {
  _id: string;
  title: string;
  slug: string;
  year: number;
  pdfUrl: string;
  fileSize?: string;
  eventDates?: string;
  venue?: string;
  cityCountry?: string;
  status: "published" | "draft";
}

export default function AdminBrochuresPage() {
  const [data, setData] = useState<BrochureItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("2027");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchBrochures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/brochures", {
        params: { page, limit, sort, order, search, year },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load brochures");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search, year]);

  useEffect(() => {
    fetchBrochures();
  }, [fetchBrochures]);

  const handleStatusToggle = async (id: string, newStatus: boolean | string) => {
    try {
      const statusStr = typeof newStatus === "boolean" ? (newStatus ? "published" : "draft") : newStatus;
      await axios.patch(`/api/brochures/${id}`, { status: statusStr });
      toast.success("Brochure status updated");
      fetchBrochures();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/brochures/${deleteId}`);
      toast.success("Brochure deleted");
      setDeleteId(null);
      fetchBrochures();
    } catch {
      toast.error("Failed to delete brochure");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<BrochureItem>[] = [
    {
      header: "Title",
      accessorKey: "title",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-semibold text-foreground flex items-center gap-2">
            <FileText size={14} className="text-primary-500 flex-shrink-0" />
            {item.title}
          </p>
          <p className="text-xs text-muted font-mono ml-[22px]">{item.slug}</p>
        </div>
      ),
    },
    {
      header: "Edition",
      accessorKey: "year",
      cell: (item) => (
        <span className="font-bold text-xs px-2.5 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
          {item.year} Edition
        </span>
      ),
    },
    {
      header: "Event Dates",
      accessorKey: "eventDates",
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <CalendarDays size={13} className="text-primary-500 flex-shrink-0" />
          <span>{item.eventDates || "-"}</span>
        </div>
      ),
    },
    {
      header: "Venue",
      accessorKey: "venue",
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={13} className="text-primary-500 flex-shrink-0" />
          <span>{item.cityCountry || item.venue || "-"}</span>
        </div>
      ),
    },
    {
      header: "File Size",
      accessorKey: "fileSize",
      cell: (item) => <span className="text-xs text-muted font-mono">{item.fileSize || "-"}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => (
        <Badge variant={item.status === "published" ? "success" : "warning"}>
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event Brochures</h1>
          <p className="text-sm text-muted mt-0.5">Manage yearly event brochures and PDF documents</p>
        </div>
        <Link
          href="/admin/brochures/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Brochure
        </Link>
      </div>

      <YearFilterTabs
        selectedYear={year}
        onYearChange={(y) => { setYear(y); setPage(1); }}
        labelPrefix="Brochures"
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        sort={sort}
        order={order}
        search={search}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSortChange={(s, o) => { setSort(s); setOrder(o); }}
        onSearchChange={setSearch}
        onStatusToggle={handleStatusToggle}
        onBulkDelete={(ids) => setBulkIds(ids)}
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/brochures/${item._id}/edit`}
              className="p-1.5 hover:bg-card-hover text-muted hover:text-foreground rounded transition-colors"
            >
              <Edit size={16} />
            </Link>
            <button
              onClick={() => setDeleteId(item._id)}
              className="p-1.5 hover:bg-danger-50 text-muted hover:text-danger-600 dark:hover:bg-danger-500/10 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Brochure"
        message="Are you sure you want to delete this brochure?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Brochures"
        message={`Are you sure you want to delete ${bulkIds.length} selected brochures?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(bulkIds.map((id) => axios.delete(`/api/brochures/${id}`)));
            toast.success("Brochures deleted");
            setBulkIds([]);
            fetchBrochures();
          } catch {
            toast.error("Failed to delete brochures");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
