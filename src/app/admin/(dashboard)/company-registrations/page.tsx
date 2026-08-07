"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Mail, Hash, MapPin, Globe, TrendingUp, BarChart2, Gem } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ExportCsvButton from "@/components/admin/ExportCsvButton";

interface CompanyRegistrationItem {
  _id: string;
  registrationNumber: string;
  companyName: string;
  marketCap?: string;
  primaryExchangeTicker?: string;
  commodity?: string;
  projectStage?: string;
  location?: string;
  email: string;
  signUpForNews: boolean;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export default function AdminCompanyRegistrationsPage() {
  const [data, setData] = useState<CompanyRegistrationItem[]>([]);
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
      const res = await axios.get("/api/company-registrations", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load company registrations");
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
      await axios.delete(`/api/company-registrations/${deleteId}`);
      toast.success("Company registration deleted");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete company registration");
    } finally {
      setDeleting(false);
    }
  };

  const stageVariant = (
    stage?: string
  ): "success" | "warning" | "info" | "default" => {
    const map: Record<string, "success" | "warning" | "info" | "default"> = {
      Producer: "success",
      Developer: "info",
      Explorer: "warning",
      Royalty: "default",
      "Project Generator": "default",
    };
    return stage ? map[stage] ?? "default" : "default";
  };

  const columns: Column<CompanyRegistrationItem>[] = [
    {
      header: "Reg #",
      accessorKey: "registrationNumber",
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
          <Hash size={14} />
          <span>{item.registrationNumber}</span>
        </div>
      ),
    },
    {
      header: "Company",
      accessorKey: "companyName",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-semibold text-foreground">{item.companyName}</p>
          <p className="text-xs text-muted flex items-center gap-1">
            <Mail size={12} />
            {item.email}
          </p>
        </div>
      ),
    },
    {
      header: "Ticker",
      accessorKey: "primaryExchangeTicker",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <BarChart2 size={14} className="text-muted shrink-0" />
          <span className="text-xs font-mono font-semibold text-foreground">
            {item.primaryExchangeTicker || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Market Cap",
      accessorKey: "marketCap",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-muted shrink-0" />
          <span className="text-xs font-medium text-foreground">
            {item.marketCap || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Commodity",
      accessorKey: "commodity",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <Gem size={14} className="text-muted shrink-0" />
          <span className="text-xs text-muted">
            {item.commodity || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Project Stage",
      accessorKey: "projectStage",
      cell: (item) =>
        item.projectStage ? (
          <Badge variant={stageVariant(item.projectStage)}>
            {item.projectStage}
          </Badge>
        ) : (
          <span className="text-xs text-muted">—</span>
        ),
    },
    {
      header: "Location",
      accessorKey: "location",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-muted shrink-0" />
          <span className="text-xs text-muted">{item.location || "—"}</span>
        </div>
      ),
    },
    {
      header: "News",
      accessorKey: "signUpForNews",
      cell: (item) => (
        <Badge variant={item.signUpForNews ? "success" : "default"}>
          {item.signUpForNews ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (item) => {
        const variants: Record<string, "success" | "warning" | "danger"> = {
          confirmed: "success",
          pending: "warning",
          cancelled: "danger",
        };
        return <Badge variant={variants[item.status]}>{item.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Company Registrations
          </h1>
          <p className="text-sm text-muted mt-0.5">
            View and manage company registration submissions from the public form
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
            <Globe size={16} className="text-sky-500" />
            <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
              {total} Total
            </span>
          </div>
          <ExportCsvButton
            endpoint="/api/company-registrations/export"
            search={search}
            sort={sort}
            order={order}
            total={total}
          />
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
              title="Delete"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Company Registration"
        message="Are you sure you want to delete this company registration record? This cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Company Registrations"
        message={`Are you sure you want to delete ${bulkIds.length} selected company registration records?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(
              bulkIds.map((id) =>
                axios.delete(`/api/company-registrations/${id}`)
              )
            );
            toast.success("Company registrations deleted");
            setBulkIds([]);
            fetchData();
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
