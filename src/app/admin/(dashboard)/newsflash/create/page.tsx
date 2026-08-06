"use client";

import { useState } from "react";
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
import { newsflashSchema, NewsflashInput } from "@/lib/validations/newsflash";

export default function CreateNewsflashPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<NewsflashInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(newsflashSchema) as any,
    defaultValues: {
      title: "",
      subheading: "",
      content: "",
      date: "",
      category: "Newsflash",
      status: "published",
      isFeatured: false,
    },
  });

  const onSubmit = async (data: NewsflashInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/newsflash", data);
      if (res.data.success) {
        toast.success("Newsflash posted successfully!");
        router.push("/admin/newsflash");
      }
    } catch {
      toast.error("Failed to create newsflash article");
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Post Newsflash</h1>
          <p className="text-sm text-muted mt-0.5">
            Publish a news announcement or press release for frontend display
          </p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Announcement Details
            </h2>
            <TextField
              name="title"
              label="Headline / Title"
              required
              placeholder="THE Mining Investment Event Announces Winners..."
            />
            <TextareaField
              name="subheading"
              label="Subheading / Excerpt"
              placeholder="Short lead paragraph or subtitle summarizing the news..."
            />
            <TextField
              name="date"
              label="Display Date Tag"
              placeholder="e.g. JUL 5, 2026 or July 2026"
            />
            <RichTextEditorField
              name="content"
              label="Full Press Release Body"
              placeholder="Write or paste the full press release here…"
              helperText="Paste directly from Word, Google Docs or a webpage — formatting, links and lists are preserved."
            />
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
              <TextField
                name="category"
                label="Category"
                required
                placeholder="Newsflash / Press Release"
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
              label="Featured Newsflash"
              helperText="Highlight on top news banner or hero section"
            />
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
              Publish Newsflash
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
