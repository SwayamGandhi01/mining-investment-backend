"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, UserCheck } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import YearFilterTabs from "@/components/common/YearFilterTabs";

interface SpeakerItem {
  _id: string;
  name: string;
  slug: string;
  title: string;
  company: string;
  category?: string;
  year?: number;
  status: "published" | "draft";
  isFeatured: boolean;
}

export default function AdminSpeakersPage() {
  const [data, setData] = useState<SpeakerItem[]>([]);
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

  const fetchSpeakers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/speakers", {
        params: { page, limit, sort, order, search, year },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load speakers");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search, year]);

  useEffect(() => {
    fetchSpeakers();
  }, [fetchSpeakers]);

  const handleStatusToggle = async (id: string, newStatus: boolean | string) => {
    try {
      const statusStr = typeof newStatus === "boolean" ? (newStatus ? "published" : "draft") : newStatus;
      await axios.patch(`/api/speakers/${id}`, { status: statusStr });
      toast.success("Speaker status updated");
      fetchSpeakers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/speakers/${deleteId}`);
      toast.success("Speaker deleted");
      setDeleteId(null);
      fetchSpeakers();
    } catch {
      toast.error("Failed to delete speaker");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<SpeakerItem>[] = [
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-semibold text-foreground">{item.name}</p>
          <p className="text-xs text-muted font-mono">{item.slug}</p>
        </div>
      ),
    },
    {
      header: "Title & Company",
      accessorKey: "title",
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <UserCheck size={14} className="text-primary-500" />
          <span>{item.title} at <strong className="text-foreground">{item.company}</strong></span>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (item) => (
        <span className="text-xs text-muted">{item.category || "Speaker"}</span>
      ),
    },
    {
      header: "Edition",
      accessorKey: "year",
      cell: (item) => (
        <span className="font-semibold text-xs text-primary-600 dark:text-primary-400">{item.year || 2027}</span>
      ),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event Speakers</h1>
          <p className="text-sm text-muted mt-0.5">Manage yearwise speakers and keynote presenters</p>
        </div>
        <Link
          href="/admin/speakers/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Speaker
        </Link>
      </div>

      <YearFilterTabs
        selectedYear={year}
        onYearChange={(y) => { setYear(y); setPage(1); }}
        labelPrefix="Speakers"
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
        onSortChange={(s, o) => {
          setSort(s);
          setOrder(o);
        }}
        onSearchChange={setSearch}
        onStatusToggle={handleStatusToggle}
        onBulkDelete={(ids) => setBulkIds(ids)}
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/speakers/${item._id}/edit`}
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
        title="Delete Speaker"
        message="Are you sure you want to delete this speaker profile?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Speakers"
        message={`Are you sure you want to delete ${bulkIds.length} selected speakers?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(bulkIds.map((id) => axios.delete(`/api/speakers/${id}`)));
            toast.success("Speakers deleted");
            setBulkIds([]);
            fetchSpeakers();
          } catch {
            toast.error("Failed to delete speakers");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
