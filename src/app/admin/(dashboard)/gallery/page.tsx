"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface GalleryItem {
  _id: string;
  title: string;
  slug: string;
  category: string;
  images: { url: string; publicId: string }[];
  status: "published" | "draft";
}

export default function AdminGalleryPage() {
  const [data, setData] = useState<GalleryItem[]>([]);
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

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/gallery", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load gallery albums");
    } finally {
      setLoading(false);
    }
  }, [page, limit, sort, order, search]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const handleStatusToggle = async (id: string, newStatus: boolean | string) => {
    try {
      const statusStr = typeof newStatus === "boolean" ? (newStatus ? "published" : "draft") : newStatus;
      await axios.patch(`/api/gallery/${id}`, { status: statusStr });
      toast.success("Gallery album status updated");
      fetchGallery();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/gallery/${deleteId}`);
      toast.success("Gallery album deleted");
      setDeleteId(null);
      fetchGallery();
    } catch {
      toast.error("Failed to delete gallery album");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<GalleryItem>[] = [
    {
      header: "Album Title",
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
      header: "Category",
      accessorKey: "category",
      cell: (item) => <span className="text-xs text-muted">{item.category}</span>,
    },
    {
      header: "Photos",
      accessorKey: "images",
      cell: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <ImageIcon size={14} className="text-primary-500" />
          <span>{item.images?.length || 0} photos</span>
        </div>
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
          <h1 className="text-2xl font-bold text-foreground">Media Gallery</h1>
          <p className="text-sm text-muted mt-0.5">Manage photo albums and event media coverage</p>
        </div>
        <Link
          href="/admin/gallery/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
        >
          <Plus size={18} />
          Create Album
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
              href={`/admin/gallery/${item._id}/edit`}
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
        title="Delete Album"
        message="Are you sure you want to delete this gallery album?"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Albums"
        message={`Are you sure you want to delete ${bulkIds.length} selected gallery albums?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(bulkIds.map((id) => axios.delete(`/api/gallery/${id}`)));
            toast.success("Albums deleted");
            setBulkIds([]);
            fetchGallery();
          } catch {
            toast.error("Failed to delete albums");
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setBulkIds([])}
      />
    </div>
  );
}
