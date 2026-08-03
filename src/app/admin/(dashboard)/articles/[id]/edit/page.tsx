"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { TextField } from "@/components/forms/TextField";
import { TextareaField } from "@/components/forms/TextareaField";
import { SelectField } from "@/components/forms/SelectField";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { PdfUploadField } from "@/components/forms/PdfUploadField";
import { articleSchema, ArticleInput } from "@/lib/validations/article";

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const methods = useForm<ArticleInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(articleSchema) as any,
    defaultValues: {
      title: "",
      pdfUrl: "",
      publishDate: new Date(),
      description: "",
      status: "published",
    },
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`/api/articles/${id}`);
        if (res.data.success) {
          const a = res.data.data;
          methods.reset({
            title: a.title || "",
            coverImage: a.coverImage?.url ? a.coverImage : undefined,
            pdfUrl: a.pdfUrl || "",
            pdfPublicId: a.pdfPublicId || "",
            publishDate: a.publishDate ? new Date(a.publishDate) : new Date(),
            description: a.description || "",
            status: a.status || "published",
          });
        }
      } catch {
        toast.error("Failed to load article");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id, methods]);

  const onSubmit = async (data: ArticleInput) => {
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/articles/${id}`, data);
      if (res.data.success) {
        toast.success("Article updated successfully!");
        router.push("/admin/articles");
      }
    } catch {
      toast.error("Failed to update article");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/articles"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Article</h1>
          <p className="text-sm text-muted mt-0.5">
            Update the article details, cover image or PDF
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Article Details
            </h2>
            <TextField
              name="title"
              label="Article Title"
              required
              placeholder="Q1 Mining Investment Outlook"
            />
            <DatePickerField
              name="publishDate"
              label="Publish Date"
              helperText="Shown on the website and used to sort articles, newest first"
            />
            <TextareaField name="description" label="Description" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Cover Image
            </h2>
            <ImageUploadField
              name="coverImage"
              label="Article Cover"
              folder="articles"
              helperText="Used as the thumbnail in listings and behind the flipbook loader"
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              PDF Document
            </h2>
            <PdfUploadField
              name="pdfUrl"
              label="Article PDF"
              placeholder="Upload PDF or paste Cloudinary/direct PDF URL"
            />
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
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/articles"
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
              Update Article
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
