"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, CalendarDays, BookOpen } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatDate } from "@/lib/utils";

interface ArticleItem {
  _id: string;
  title: string;
  slug: string;
  coverImage?: { url: string; publicId: string };
  pdfUrl: string;
  publishDate: string;
  description?: string;
  status: "published" | "draft";
}

export default function AdminArticlesPage() {
  const [data, setData] = useState<ArticleItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState("publishDate");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/articles", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleStatusToggle = async (id: string, newStatus: boolean | string) => {
    try {
      const statusStr =
        typeof newStatus === "boolean" ? (newStatus ? "published" : "draft") : newStatus;
      await axios.patch(`/api/articles/${id}`, { status: statusStr });
      toast.success("Article status updated");
      fetchArticles();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/articles/${deleteId}`);
      toast.success("Article deleted");
      setDeleteId(null);
      fetchArticles();
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<ArticleItem>[] = [
    {
      header: "Cover",
      accessorKey: "coverImage",
      cell: (item) =>
        item.coverImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImage.url}
            alt={item.title}
            className="h-14 w-11 object-cover rounded border border-border"
          />
        ) : (
          <div className="h-14 w-11 flex items-center justify-center rounded border border-dashed border-border text-muted">
            <BookOpen size={16} />
          </div>
        ),
    },
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
      header: "Publish Date",
      accessorKey: "publishDate",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <CalendarDays size={13} className="text-primary-500 flex-shrink-0" />
          <span>{item.publishDate ? formatDate(item.publishDate) : "-"}</span>
        </div>
      ),
    },
    {
      header: "PDF",
      accessorKey: "pdfUrl",
      cell: (item) =>
        item.pdfUrl ? (
          <a
            href={item.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <FileText size={13} className="flex-shrink-0" />
            View PDF
          </a>
        ) : (
          <span className="text-xs text-muted">-</span>
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
          <h1 className="text-2xl font-bold text-foreground">Articles</h1>
          <p className="text-sm text-muted mt-0.5">
            Publish PDF articles that readers open as a flipbook on the website
          </p>
        </div>
        <Link
          href="/admin/articles/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Add Article
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
              href={`/admin/articles/${item._id}/edit`}
              className="p-1.5 hover:bg-card-hover text-muted hover:text-foreground rounded transition-colors"
              title="Edit"
            >
              <Edit size={16} />
            </Link>
            <button
              onClick={() => setDeleteId(item._id)}
              className="p-1.5 hover:bg-danger-50 text-muted hover:text-danger-600 dark:hover:bg-danger-500/10 rounded transition-colors"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Article"
        message="Are you sure you want to delete this article? This permanently removes it from the database and cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Articles"
        message={`Are you sure you want to permanently delete ${bulkIds.length} selected articles?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(bulkIds.map((id) => axios.delete(`/api/articles/${id}`)));
            toast.success("Articles deleted");
            setBulkIds([]);
            fetchArticles();
          } catch {
            toast.error("Failed to delete articles");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
