"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Mail, Hash } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface RegistrationItem {
  _id: string;
  registrationNumber: string;
  name: string;
  email: string;
  event?: { title: string };
  ticketType: string;
  paymentStatus: "pending" | "completed" | "refunded" | "free";
  status: "pending" | "confirmed" | "cancelled" | "attended";
}

export default function AdminRegistrationsPage() {
  const [data, setData] = useState<RegistrationItem[]>([]);
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

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/registrations", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/registrations/${deleteId}`);
      toast.success("Registration record deleted");
      setDeleteId(null);
      fetchRegistrations();
    } catch {
      toast.error("Failed to delete registration");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<RegistrationItem>[] = [
    {
      header: "Reg #",
      accessorKey: "registrationNumber",
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-primary-600">
          <Hash size={14} />
          <span>{item.registrationNumber}</span>
        </div>
      ),
    },
    {
      header: "Attendee",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-semibold text-foreground">{item.name}</p>
          <p className="text-xs text-muted flex items-center gap-1">
            <Mail size={12} /> {item.email}
          </p>
        </div>
      ),
    },
    {
      header: "Event",
      accessorKey: "event",
      cell: (item) => (
        <span className="text-xs text-muted font-medium">
          {item.event?.title || "N/A"}
        </span>
      ),
    },
    {
      header: "Ticket",
      accessorKey: "ticketType",
      cell: (item) => <Badge variant="info">{item.ticketType}</Badge>,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => {
        const variants: Record<string, "success" | "warning" | "danger" | "default"> = {
          confirmed: "success",
          pending: "warning",
          cancelled: "danger",
          attended: "default",
        };
        return <Badge variant={variants[item.status]}>{item.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event Registrations</h1>
          <p className="text-sm text-muted mt-0.5">Manage attendee tickets and registration records</p>
        </div>
        <Link
          href="/admin/registrations/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          New Registration
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
        onBulkDelete={(ids) => setBulkIds(ids)}
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            <Link
              href={`/admin/registrations/${item._id}/edit`}
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
        title="Delete Registration"
        message="Are you sure you want to delete this registration record?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Registrations"
        message={`Are you sure you want to delete ${bulkIds.length} selected registration records?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(bulkIds.map((id) => axios.delete(`/api/registrations/${id}`)));
            toast.success("Registrations deleted");
            setBulkIds([]);
            fetchRegistrations();
          } catch {
            toast.error("Failed to delete records");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
