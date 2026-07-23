"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

import YearFilterTabs from "@/components/common/YearFilterTabs";

interface CompanyItem {
  _id: string;
  name: string;
  slug: string;
  ticker?: string;
  type?: string;
  location?: string;
  commodities?: string[];
  year?: number;
  industry?: string;
  headquarters?: string;
  status: "published" | "draft";
}

export default function AdminCompaniesPage() {
  const [data, setData] = useState<CompanyItem[]>([]);
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

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/companies", {
        params: { page, limit, sort, order, search, year },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search, year]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleStatusToggle = async (id: string, newStatus: boolean | string) => {
    try {
      const statusStr = typeof newStatus === "boolean" ? (newStatus ? "published" : "draft") : newStatus;
      await axios.patch(`/api/companies/${id}`, { status: statusStr });
      toast.success("Company status updated");
      fetchCompanies();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/companies/${deleteId}`);
      toast.success("Company deleted");
      setDeleteId(null);
      fetchCompanies();
    } catch {
      toast.error("Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<CompanyItem>[] = [
    {
      header: "Company Name",
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
      header: "Ticker",
      accessorKey: "ticker",
      cell: (item) => (
        <span className="inline-block px-2 py-0.5 bg-secondary-100 dark:bg-card-hover font-mono text-xs font-semibold rounded text-foreground">
          {item.ticker || "-"}
        </span>
      ),
    },
    {
      header: "Type",
      accessorKey: "type",
      cell: (item) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          {item.type || "EXPLORER"}
        </span>
      ),
    },
    {
      header: "Location",
      accessorKey: "location",
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs text-muted">
          <Building2 size={13} className="text-primary-500 flex-shrink-0" />
          <span>{item.location || item.headquarters || "-"}</span>
        </div>
      ),
    },
    {
      header: "Commodities",
      accessorKey: "commodities",
      cell: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.commodities && item.commodities.length > 0 ? (
            item.commodities.map((c, i) => (
              <span key={i} className="px-1.5 py-0.5 bg-border/50 text-[10px] font-medium rounded text-muted">
                {c}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Edition",
      accessorKey: "year",
      cell: (item) => (
        <span className="font-semibold text-xs text-primary-600 dark:text-primary-400">
          {item.year || 2027}
        </span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Participating Companies</h1>
          <p className="text-sm text-muted mt-0.5">Manage participating companies yearwise (2027, 2028, 2026, etc.)</p>
        </div>
        <Link
          href="/admin/companies/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Company
        </Link>
      </div>

      <YearFilterTabs
        selectedYear={year}
        onYearChange={(y) => {
          setYear(y);
          setPage(1);
        }}
        labelPrefix="Participating Companies"
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
              href={`/admin/companies/${item._id}/edit`}
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
        title="Delete Company"
        message="Are you sure you want to delete this company profile?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Companies"
        message={`Are you sure you want to delete ${bulkIds.length} selected companies?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(bulkIds.map((id) => axios.delete(`/api/companies/${id}`)));
            toast.success("Companies deleted");
            setBulkIds([]);
            fetchCompanies();
          } catch {
            toast.error("Failed to delete companies");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
