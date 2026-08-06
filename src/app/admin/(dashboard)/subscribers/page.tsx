"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Mail, User, CalendarDays, Trash2 } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface SubscriberItem {
  _id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export default function AdminSubscribersPage() {
  const [data, setData] = useState<SubscriberItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/subscribers", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/subscribers/${deleteId}`);
      toast.success("Subscriber removed");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Failed to remove subscriber");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<SubscriberItem>[] = [
    {
      header: "Name",
      accessorKey: "fullName",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <User size={14} className="text-muted shrink-0" />
          <span className="font-semibold text-foreground">{item.fullName}</span>
        </div>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      sortable: true,
      cell: (item) => (
        <a
          href={`mailto:${item.email}`}
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          <Mail size={13} className="shrink-0" />
          {item.email}
        </a>
      ),
    },
    {
      header: "Subscribed",
      accessorKey: "createdAt",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <CalendarDays size={13} className="text-primary-500 shrink-0" />
          <span>{item.createdAt ? formatDate(item.createdAt) : "—"}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscribers</h1>
          <p className="text-sm text-muted mt-0.5">
            Newsletter sign-ups collected from the public website
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-lg">
          <Mail size={16} className="text-primary-500" />
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {total} Total
          </span>
        </div>
      </div>

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
        onBulkDelete={(ids) => setBulkIds(ids)}
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteId(item._id)}
              className="p-1.5 hover:bg-danger-50 text-muted hover:text-danger-600 dark:hover:bg-danger-500/10 rounded transition-colors"
              title="Remove subscriber"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Remove Subscriber"
        message="Are you sure you want to remove this subscriber? This permanently deletes them from the database and cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Remove Multiple Subscribers"
        message={`Are you sure you want to permanently remove ${bulkIds.length} selected subscribers?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(
              bulkIds.map((id) => axios.delete(`/api/subscribers/${id}`))
            );
            toast.success("Subscribers removed");
            setBulkIds([]);
            fetchData();
          } catch {
            toast.error("Failed to remove subscribers");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
