"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Mail,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Trash2,
  CalendarDays,
  Lock,
} from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useAuth } from "@/components/admin/AuthProvider";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AdminRequestItem {
  _id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "editor";
  status?: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  reviewNote?: string;
}

const STATUS_TABS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

export default function AdminRequestsPage() {
  const { admin } = useAuth();
  const isSuperAdmin = admin?.role === "superadmin";

  const [data, setData] = useState<AdminRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");

  const [review, setReview] = useState<{ item: AdminRequestItem; action: "approve" | "reject" } | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminRequestItem | null>(null);
  const [working, setWorking] = useState(false);

  const fetchData = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/api/admin-requests", {
        params: { page, limit, sort, order, search, status },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load admin requests");
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, page, limit, sort, order, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReview = async () => {
    if (!review) return;
    setWorking(true);
    try {
      const res = await axios.patch(`/api/admin-requests/${review.item._id}`, {
        action: review.action,
      });
      toast.success(res.data?.message || "Request updated");
      setReview(null);
      fetchData();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to update the request";
      toast.error(message);
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setWorking(true);
    try {
      await axios.delete(`/api/admin-requests/${deleteItem._id}`);
      toast.success("Request deleted");
      setDeleteItem(null);
      fetchData();
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to delete the request";
      toast.error(message);
    } finally {
      setWorking(false);
    }
  };

  const columns: Column<AdminRequestItem>[] = [
    {
      header: "Requester",
      accessorKey: "name",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-semibold text-foreground">{item.name}</p>
          <p className="text-xs text-muted flex items-center gap-1">
            <Mail size={12} />
            {item.email}
          </p>
        </div>
      ),
    },
    {
      header: "Requested Role",
      accessorKey: "role",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          {item.role === "superadmin" ? (
            <ShieldAlert size={14} className="text-amber-500 shrink-0" />
          ) : (
            <ShieldCheck size={14} className="text-muted shrink-0" />
          )}
          <span
            className={cn(
              "text-xs font-semibold",
              item.role === "superadmin"
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground"
            )}
          >
            {item.role}
          </span>
        </div>
      ),
    },
    {
      header: "Requested",
      accessorKey: "createdAt",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <CalendarDays size={13} className="text-primary-500 shrink-0" />
          <span>{item.createdAt ? formatDate(item.createdAt) : "—"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => {
        const variants: Record<string, "success" | "warning" | "danger"> = {
          approved: "success",
          pending: "warning",
          rejected: "danger",
        };
        const value = item.status || "approved";
        return <Badge variant={variants[value]}>{value}</Badge>;
      },
    },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/20 mb-4">
          <Lock size={24} className="text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Superadmin only</h1>
        <p className="text-sm text-muted mt-1 max-w-md">
          Only a superadmin can review admin account requests. Ask a superadmin
          to approve new accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Requests</h1>
          <p className="text-sm text-muted mt-0.5">
            Approve or reject people who signed up for an admin account
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <ShieldAlert size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {status === "pending" ? `${total} Awaiting review` : `${total} Total`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto bg-card border border-border rounded-xl p-3 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted shrink-0 mr-1">
          Status:
        </span>
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 shrink-0 whitespace-nowrap",
              status === tab.value
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-secondary-100 dark:bg-card-hover text-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
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
        actions={(item) => (
          <div className="flex items-center justify-end gap-2">
            {item.status === "pending" ? (
              <>
                <button
                  onClick={() => setReview({ item, action: "approve" })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                  title="Approve this request"
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  onClick={() => setReview({ item, action: "reject" })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-danger-500/30 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
                  title="Reject this request"
                >
                  <X size={14} />
                  Reject
                </button>
              </>
            ) : item.status === "rejected" ? (
              <button
                onClick={() => setDeleteItem(item)}
                className="p-1.5 hover:bg-danger-50 text-muted hover:text-danger-600 dark:hover:bg-danger-500/10 rounded transition-colors"
                title="Delete this request"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <span className="text-xs text-muted">—</span>
            )}
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={Boolean(review)}
        title={review?.action === "approve" ? "Approve Admin Request" : "Reject Admin Request"}
        message={
          review?.action === "approve"
            ? `Approve ${review?.item.name} as ${review?.item.role}? They will be able to log in immediately${
                review?.item.role === "superadmin"
                  ? ", with the same full access you have — including approving other admins."
                  : "."
              }`
            : `Reject ${review?.item.name}'s request? They will not be able to log in.`
        }
        variant={review?.action === "approve" ? "info" : "danger"}
        confirmLabel={review?.action === "approve" ? "Approve" : "Reject"}
        loading={working}
        onConfirm={handleReview}
        onCancel={() => setReview(null)}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteItem)}
        title="Delete Admin Request"
        message={`Permanently delete ${deleteItem?.name}'s rejected request? This cannot be undone.`}
        loading={working}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
}
