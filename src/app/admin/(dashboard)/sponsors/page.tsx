"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Globe } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import YearFilterTabs from "@/components/common/YearFilterTabs";

interface SponsorItem {
  _id: string;
  name: string;
  slug: string;
  tier: "platinum" | "gold" | "silver" | "bronze";
  year?: number;
  website?: string;
  status: "published" | "draft";
  isFeatured: boolean;
}

export default function AdminSponsorsPage() {
  const [data, setData] = useState<SponsorItem[]>([]);
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

  const fetchSponsors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/sponsors", {
        params: { page, limit, sort, order, search, year },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load sponsors");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search, year]);

  useEffect(() => {
    fetchSponsors();
  }, [fetchSponsors]);

  const handleStatusToggle = async (id: string, newStatus: boolean | string) => {
    try {
      const statusStr = typeof newStatus === "boolean" ? (newStatus ? "published" : "draft") : newStatus;
      await axios.patch(`/api/sponsors/${id}`, { status: statusStr });
      toast.success("Sponsor status updated");
      fetchSponsors();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/sponsors/${deleteId}`);
      toast.success("Sponsor deleted");
      setDeleteId(null);
      fetchSponsors();
    } catch {
      toast.error("Failed to delete sponsor");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<SponsorItem>[] = [
    {
      header: "Sponsor Name",
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
      header: "Sponsorship Tier",
      accessorKey: "tier",
      cell: (item) => {
        const tierVariants: Record<string, "default" | "warning" | "info" | "secondary"> = {
          platinum: "default",
          gold: "warning",
          silver: "info",
          bronze: "secondary",
        };
        return <Badge variant={tierVariants[item.tier]}>{item.tier.toUpperCase()}</Badge>;
      },
    },
    {
      header: "Website",
      accessorKey: "website",
      cell: (item) =>
        item.website ? (
          <a
            href={item.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
          >
            <Globe size={14} />
            <span>Visit Link</span>
          </a>
        ) : (
          <span className="text-xs text-muted">-</span>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event Sponsors</h1>
          <p className="text-sm text-muted mt-0.5">Manage yearwise event partners and sponsors</p>
        </div>
        <Link
          href="/admin/sponsors/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Sponsor
        </Link>
      </div>

      <YearFilterTabs
        selectedYear={year}
        onYearChange={(y) => { setYear(y); setPage(1); }}
        labelPrefix="Sponsors"
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
              href={`/admin/sponsors/${item._id}/edit`}
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
        title="Delete Sponsor"
        message="Are you sure you want to delete this sponsor?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Sponsors"
        message={`Are you sure you want to delete ${bulkIds.length} selected sponsors?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(bulkIds.map((id) => axios.delete(`/api/sponsors/${id}`)));
            toast.success("Sponsors deleted");
            setBulkIds([]);
            fetchSponsors();
          } catch {
            toast.error("Failed to delete sponsors");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
