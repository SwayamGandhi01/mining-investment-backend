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
import { sponsorSchema, SponsorInput } from "@/lib/validations/sponsor";

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029].map((y) => ({
  label: String(y),
  value: String(y),
}));

export default function EditSponsorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<SponsorInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(sponsorSchema) as any,
  });

  useEffect(() => {
    const fetchSponsor = async () => {
      try {
        const res = await axios.get(`/api/sponsors/${id}`);
        if (res.data.success) {
          methods.reset(res.data.data);
        }
      } catch {
        toast.error("Failed to load sponsor");
      } finally {
        setLoading(false);
      }
    };
    fetchSponsor();
  }, [id, methods]);

  const onSubmit = async (data: SponsorInput) => {
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/sponsors/${id}`, data);
      if (res.data.success) {
        toast.success("Sponsor updated successfully!");
        router.push("/admin/sponsors");
      }
    } catch {
      toast.error("Failed to update sponsor");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading sponsor details..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/sponsors"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Sponsor</h1>
          <p className="text-sm text-muted mt-0.5">Update sponsor information</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Sponsor Details
            </h2>
            <TextField name="name" label="Sponsor Name" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                name="tier"
                label="Sponsorship Tier"
                options={[
                  { label: "Platinum", value: "platinum" },
                  { label: "Gold", value: "gold" },
                  { label: "Silver", value: "silver" },
                  { label: "Bronze", value: "bronze" },
                ]}
              />
              <TextField name="website" label="Website URL" />
            </div>
            <TextareaField name="description" label="Company Description" />
            <ImageUploadField name="logo" label="Brand Logo" folder="sponsors" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Display & Visibility
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField
                name="year"
                label="Event Edition (Year)"
                options={YEAR_OPTIONS}
              />
              <SelectField
                name="status"
                label="Status"
                options={[
                  { label: "Published", value: "published" },
                  { label: "Draft", value: "draft" },
                ]}
              />
              <TextField name="order" label="Display Order" type="number" />
            </div>
            <ToggleField name="isFeatured" label="Featured Sponsor" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/sponsors"
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
              Update Sponsor
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
