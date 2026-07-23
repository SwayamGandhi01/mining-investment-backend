"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { TextField } from "@/components/forms/TextField";
import { TextareaField } from "@/components/forms/TextareaField";
import { SelectField } from "@/components/forms/SelectField";
import { ToggleField } from "@/components/forms/ToggleField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { exhibitorSchema, ExhibitorInput } from "@/lib/validations/exhibitor";

export default function EditExhibitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<ExhibitorInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(exhibitorSchema) as any,
  });

  useEffect(() => {
    const fetchExhibitor = async () => {
      try {
        const res = await axios.get(`/api/exhibitors/${id}`);
        if (res.data.success) {
          methods.reset(res.data.data);
        }
      } catch {
        toast.error("Failed to load exhibitor");
      } finally {
        setLoading(false);
      }
    };
    fetchExhibitor();
  }, [id, methods]);

  const onSubmit = async (data: ExhibitorInput) => {
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/exhibitors/${id}`, data);
      if (res.data.success) {
        toast.success("Exhibitor updated successfully!");
        router.push("/admin/exhibitors");
      }
    } catch {
      toast.error("Failed to update exhibitor");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading exhibitor..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/exhibitors"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Exhibitor</h1>
          <p className="text-sm text-muted mt-0.5">Update exhibitor profile and booth info</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Exhibitor Profile
            </h2>
            <TextField name="name" label="Exhibitor Name" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="boothNumber" label="Booth Number" />
              <TextField name="category" label="Category" />
            </div>
            <TextareaField name="description" label="Description" />
            <ImageUploadField name="logo" label="Logo Image" folder="exhibitors" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Contact & Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField name="contactPerson" label="Contact Person" />
              <TextField name="contactEmail" label="Contact Email" />
              <TextField name="website" label="Website URL" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Settings
            </h2>
            <SelectField
              name="status"
              label="Status"
              options={[
                { label: "Published", value: "published" },
                { label: "Draft", value: "draft" },
              ]}
            />
            <ToggleField name="isFeatured" label="Featured Exhibitor" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/exhibitors"
              className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Update Exhibitor
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
