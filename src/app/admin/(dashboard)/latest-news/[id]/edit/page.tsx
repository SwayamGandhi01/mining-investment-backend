"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { TextField } from "@/components/forms/TextField";
import { TextareaField } from "@/components/forms/TextareaField";
import { RichTextEditorField } from "@/components/forms/RichTextEditorField";
import { SelectField } from "@/components/forms/SelectField";
import { ToggleField } from "@/components/forms/ToggleField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { PdfUploadField } from "@/components/forms/PdfUploadField";
import { latestNewsSchema, LatestNewsInput } from "@/lib/validations/latestNews";
import { newsCategoryOptions } from "@/lib/newsCategories";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditLatestNewsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<LatestNewsInput>({
    resolver: zodResolver(latestNewsSchema) as any,
  });

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      try {
        const res = await axios.get(`/api/latest-news/${id}`);
        if (res.data.success) {
          methods.reset(res.data.data);
        }
      } catch {
        toast.error("Failed to load latest news item");
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [id, methods]);

  // Keeps an older item's category (e.g. "Latest News") in the dropdown, so
  // opening it for editing does not silently retag it.
  const currentCategory = methods.watch("category");

  const onSubmit = async (data: LatestNewsInput) => {
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/latest-news/${id}`, data);
      if (res.data.success) {
        toast.success("Latest news item updated successfully!");
        router.push("/admin/latest-news");
      }
    } catch {
      toast.error("Failed to update latest news item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/latest-news"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit News</h1>
          <p className="text-sm text-muted mt-0.5">
            Update the latest news item for the frontend section.
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              News Details
            </h2>
            <TextField name="title" label="Headline / Title" required />
            <TextareaField name="subheading" label="Subheading / Excerpt" />
            <TextField name="date" label="Display Date" />
            <RichTextEditorField
              name="content"
              label="Full Content"
              helperText="Paste directly from Word, Google Docs or a webpage — formatting, links and lists are preserved."
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Media & Settings
            </h2>
            <ImageUploadField name="image" label="Featured Image" folder="latest-news" />
            <PdfUploadField
              name="pdfAttachment.url"
              publicIdField="pdfAttachment.publicId"
              nameField="pdfAttachment.name"
              label="PDF Attachment"
              placeholder="Upload a PDF or enter a PDF URL"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                name="category"
                label="News Category"
                options={newsCategoryOptions(currentCategory)}
              />
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
            <ToggleField
              name="isFeatured"
              label="Featured"
              helperText="Mark this item as featured for special display"
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              SEO Metadata
            </h2>
            <TextField name="seoTitle" label="SEO Title" />
            <TextareaField name="seoDescription" label="SEO Meta Description" />
            <TextField name="seoKeywords" label="SEO Keywords" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/latest-news"
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
              Save Changes
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
