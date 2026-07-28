"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Newspaper, Calendar, Tag } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface LatestNewsItem {
  _id: string;
  title: string;
  slug: string;
  subheading?: string;
  category: string;
  date?: string;
  status: "draft" | "published" | "archived";
  publishedAt?: string;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminLatestNewsPage() {
  const [data, setData] = useState<LatestNewsItem[]>([]);
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

  const fetchLatestNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/latest-news", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load latest news items");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search]);

  useEffect(() => {
    fetchLatestNews();
  }, [fetchLatestNews]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/latest-news/${deleteId}`);
      toast.success("Latest news item deleted");
      setDeleteId(null);
      fetchLatestNews();
    } catch {
      toast.error("Failed to delete latest news item");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<LatestNewsItem>[] = [
    {
      header: "Title",
      accessorKey: "title",
      sortable: true,
      cell: (item) => (
        <div className="max-w-md">
          <p className="font-semibold text-foreground truncate">{item.title}</p>
          {item.subheading && (
            <p className="text-xs text-muted line-clamp-1 mt-0.5">
              {item.subheading}
            </p>
          )}
          <p className="text-[11px] text-muted font-mono truncate">{item.slug}</p>
        </div>
      ),
    },
    {
      header: "Category / Date",
      accessorKey: "category",
      cell: (item) => (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Tag size={13} className="text-primary-500" />
            <span>{item.category || "Latest News"}</span>
          </div>
          {item.date && (
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
              {item.date}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Published",
      accessorKey: "createdAt",
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Calendar size={14} />
          <span>
            {item.publishedAt
              ? formatDate(item.publishedAt)
              : formatDate(item.createdAt)}
          </span>
        </div>
      ),
    },
    {
      header: "Featured",
      accessorKey: "isFeatured",
      cell: (item) => (
        <Badge variant={item.isFeatured ? "success" : "default"}>
          {item.isFeatured ? "Featured" : "Standard"}
        </Badge>
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
          <div className="flex items-center gap-2">
            <Newspaper size={22} className="text-sky-500" />
            <h1 className="text-2xl font-bold text-foreground">Latest News</h1>
          </div>
          <p className="text-sm text-muted mt-0.5">
            Manage the latest news posts that appear on the website frontend.
          </p>
        </div>
        <Link
          href="/admin/latest-news/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Latest News
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
              href={`/admin/latest-news/${item._id}/edit`}
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
        title="Delete Latest News"
        message="Are you sure you want to delete this latest news item?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Latest News Items"
        message={`Are you sure you want to delete ${bulkIds.length} selected items?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(
              bulkIds.map((id) => axios.delete(`/api/latest-news/${id}`))
            );
            toast.success("Latest news items deleted");
            setBulkIds([]);
            fetchLatestNews();
          } catch {
            toast.error("Failed to delete latest news items");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
