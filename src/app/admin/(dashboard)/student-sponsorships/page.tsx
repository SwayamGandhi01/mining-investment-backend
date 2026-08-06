"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Mail,
  Hash,
  Phone,
  GraduationCap,
  BookOpen,
  Languages,
  Trash2,
} from "lucide-react";
import DataTable, { Column } from "@/components/tables/DataTable";
import Badge from "@/components/common/Badge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

interface StudentSponsorshipItem {
  _id: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  currentSchool: string;
  programAndYear?: string;
  email: string;
  phone: string;
  signUpForNews: boolean;
  language?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export default function AdminStudentSponsorshipsPage() {
  const [data, setData] = useState<StudentSponsorshipItem[]>([]);
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
      const res = await axios.get("/api/student-sponsorships", {
        params: { page, limit, sort, order, search },
      });
      if (res.data.success) {
        setData(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Failed to load student sponsorships");
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
      await axios.delete(`/api/student-sponsorships/${deleteId}`);
      toast.success("Student sponsorship deleted");
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete student sponsorship");
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<StudentSponsorshipItem>[] = [
    {
      header: "Reg #",
      accessorKey: "registrationNumber",
      cell: (item) => (
        <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
          <Hash size={14} />
          <span>{item.registrationNumber}</span>
        </div>
      ),
    },
    {
      header: "Student",
      accessorKey: "firstName",
      sortable: true,
      cell: (item) => (
        <div>
          <p className="font-semibold text-foreground">
            {item.firstName} {item.lastName}
          </p>
          <p className="text-xs text-muted flex items-center gap-1">
            <Mail size={12} />
            {item.email}
          </p>
        </div>
      ),
    },
    {
      header: "School",
      accessorKey: "currentSchool",
      sortable: true,
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <GraduationCap size={14} className="text-muted shrink-0" />
          <span className="text-xs font-medium text-foreground">
            {item.currentSchool}
          </span>
        </div>
      ),
    },
    {
      header: "Program & Year",
      accessorKey: "programAndYear",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <BookOpen size={14} className="text-muted shrink-0" />
          <span className="text-xs text-muted">{item.programAndYear || "—"}</span>
        </div>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <Phone size={14} className="text-muted shrink-0" />
          <span className="text-xs font-mono text-muted">{item.phone || "—"}</span>
        </div>
      ),
    },
    {
      header: "Language",
      accessorKey: "language",
      cell: (item) => (
        <div className="flex items-center gap-1.5">
          <Languages size={14} className="text-muted shrink-0" />
          <span className="text-xs text-muted">{item.language || "—"}</span>
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
            Student Sponsorships
          </h1>
          <p className="text-sm text-muted mt-0.5">
            Student Sponsorship Application submissions from the public form
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <GraduationCap size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
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
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Student Sponsorship"
        message="Are you sure you want to delete this student application? This permanently removes it from the database and cannot be undone."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        isOpen={bulkIds.length > 0}
        title="Delete Multiple Student Sponsorships"
        message={`Are you sure you want to permanently delete ${bulkIds.length} selected student applications?`}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await Promise.all(
              bulkIds.map((id) => axios.delete(`/api/student-sponsorships/${id}`))
            );
            toast.success("Student sponsorships deleted");
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
