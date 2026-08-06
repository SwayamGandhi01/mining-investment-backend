"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Calendar, MapPin } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface EventItem {
  _id: string;
  title: string;
  slug: string;
  location: string;
  startDate: string;
  endDate: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
}

export default function AdminEventsPage() {
  const [data, setData] = useState<EventItem[]>([]);
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

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/events", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleStatusToggle = async (id: string, newStatus: boolean | string) => {
    try {
      const statusStr = typeof newStatus === "boolean" ? (newStatus ? "published" : "draft") : newStatus;
      await axios.patch(`/api/events/${id}`, { status: statusStr });
      toast.success("Event status updated");
      fetchEvents();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/events/${deleteId}`);
      toast.success("Event deleted");
      setDeleteId(null);
      fetchEvents();
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkIds.length) return;
    setDeleting(true);
    try {
      await Promise.all(bulkIds.map((id) => axios.delete(`/api/events/${id}`)));
      toast.success("Events deleted successfully");
      setBulkIds([]);
      fetchEvents();
    } catch {
      toast.error("Failed to delete selected events");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<EventItem>[] = [
    {
      header: "Title",
      accessorKey: "title",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-semibold text-foreground">{item.title}</p>
          <p className="text-xs text-muted font-mono">{item.slug}</p>
        </div>
      ),
    },
    {
      header: "Location",
      accessorKey: "location",
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={14} className="text-primary-500" />
          <span>{item.location}</span>
        </div>
      ),
    },
    {
      header: "Dates",
      accessorKey: "startDate",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar size={14} className="text-muted" />
          <span>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => (
        <Badge
          variant={
            item.status === "published"
              ? "success"
              : item.status === "draft"
              ? "warning"
              : "secondary"
          }
        >
          {item.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda Interactive Schedule</h1>
          <p className="text-sm text-muted mt-0.5">Manage each schedule and its day-by-day interactive agenda</p>
        </div>
        <Link
          href="/admin/events/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Event
        </Link>
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
        onStatusToggle={handleStatusToggle}
        onBulkDelete={(ids) => setBulkIds(ids)}
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/events/${item._id}/edit`}
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
        title="Delete Event"
        message="Are you sure you want to delete this event? This action is reversible via soft delete."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Events"
        message={`Are you sure you want to delete ${bulkIds.length} selected events?`}
        loading={deleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
