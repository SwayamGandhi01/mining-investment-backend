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
import { RichTextField } from "@/components/forms/RichTextField";
import { SelectField } from "@/components/forms/SelectField";
import { ToggleField } from "@/components/forms/ToggleField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { PdfUploadField } from "@/components/forms/PdfUploadField";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { newsflashSchema, NewsflashInput } from "@/lib/validations/newsflash";

export default function EditNewsflashPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<NewsflashInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(newsflashSchema) as any,
  });

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const res = await axios.get(`/api/newsflash/${id}`);
        if (res.data.success) {
          methods.reset(res.data.data);
        }
      } catch {
        toast.error("Failed to load newsflash article");
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id, methods]);

  const onSubmit = async (data: NewsflashInput) => {
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/newsflash/${id}`, data);
      if (res.data.success) {
        toast.success("Newsflash updated successfully!");
        router.push("/admin/newsflash");
      }
    } catch {
      toast.error("Failed to update newsflash");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return <LoadingSpinner fullScreen text="Loading newsflash..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/newsflash"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Newsflash</h1>
          <p className="text-sm text-muted mt-0.5">
            Update news announcement content or publication status
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Announcement Details
            </h2>
            <TextField name="title" label="Headline / Title" required />
            <TextareaField name="subheading" label="Subheading / Excerpt" />
            <TextField name="date" label="Display Date Tag" placeholder="e.g. JUL 5, 2026" />
            <RichTextField name="content" label="Full Press Release Body" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Media & Settings
            </h2>
            <ImageUploadField name="image" label="Featured Image" folder="newsflash" />
            <PdfUploadField
              name="pdfAttachment.url"
              publicIdField="pdfAttachment.publicId"
              nameField="pdfAttachment.name"
              label="PDF Attachment"
              placeholder="Upload a PDF or enter a direct PDF URL"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="category" label="Category" required />
              <SelectField
                name="status"
                label="Publish Status"
                options={[
                  { label: "Published", value: "published" },
                  { label: "Draft", value: "draft" },
                  { label: "Archived", value: "archived" },
                ]}
              />
            </div>
            <ToggleField name="isFeatured" label="Featured Newsflash" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              SEO Optimization
            </h2>
            <TextField name="seoTitle" label="SEO Title" />
            <TextareaField name="seoDescription" label="SEO Meta Description" />
            <TextField name="seoKeywords" label="SEO Keywords" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/newsflash"
              className="px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-card-hover transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Update Newsflash
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
