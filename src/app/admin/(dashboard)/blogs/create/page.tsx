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
import { RichTextField } from "@/components/forms/RichTextField";
import { SelectField } from "@/components/forms/SelectField";
import { ToggleField } from "@/components/forms/ToggleField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { blogSchema, BlogInput } from "@/lib/validations/blog";

export default function CreateBlogPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<BlogInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(blogSchema) as any,
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      category: "Market Insights",
      status: "draft",
      isFeatured: false,
    },
  });

  const onSubmit = async (data: BlogInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/blogs", data);
      if (res.data.success) {
        toast.success("Blog article created successfully!");
        router.push("/admin/blogs");
      }
    } catch {
      toast.error("Failed to create blog post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/blogs"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Write Article</h1>
          <p className="text-sm text-muted mt-0.5">Publish insights and platform updates</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Article Content
            </h2>
            <TextField name="title" label="Article Title" required placeholder="10 Trends Reshaping Global Tech Investments" />
            <TextareaField name="excerpt" label="Short Excerpt" required placeholder="Summary snippet for list cards..." />
            <RichTextField name="content" label="Full Article Body" placeholder="Write HTML/Markdown content here..." />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Media & Categorization
            </h2>
            <ImageUploadField name="image" label="Cover Image" folder="blogs" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="category" label="Category" required placeholder="Market Insights" />
              <SelectField
                name="status"
                label="Publish Status"
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Published", value: "published" },
                  { label: "Archived", value: "archived" },
                ]}
              />
            </div>
            <ToggleField name="isFeatured" label="Featured Article" helperText="Pin article to top section" />
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
              href="/admin/blogs"
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
              Save Article
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
