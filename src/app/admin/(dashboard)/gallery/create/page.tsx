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
import { SelectField } from "@/components/forms/SelectField";
import { ToggleField } from "@/components/forms/ToggleField";
import { MultiImageUploadField } from "@/components/forms/MultiImageUploadField";
import { gallerySchema, GalleryInput } from "@/lib/validations/gallery";

export default function CreateGalleryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<GalleryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(gallerySchema) as any,
    defaultValues: {
      title: "",
      description: "",
      category: "Events",
      images: [],
      status: "published",
      isFeatured: false,
    },
  });

  const onSubmit = async (data: GalleryInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/gallery", data);
      if (res.data.success) {
        toast.success("Gallery album created successfully!");
        router.push("/admin/gallery");
      }
    } catch {
      toast.error("Failed to create album");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/gallery"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Gallery Album</h1>
          <p className="text-sm text-muted mt-0.5">Upload photos and organize a media collection</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Album Details
            </h2>
            <TextField name="title" label="Album Title" required placeholder="Summit 2026 Opening Gala" />
            <TextField name="category" label="Category" placeholder="Events / Highlights" />
            <TextareaField name="description" label="Description" placeholder="Album overview..." />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Upload Photos
            </h2>
            <MultiImageUploadField name="images" label="Photo Collection" folder="gallery" />
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
            <ToggleField name="isFeatured" label="Featured Gallery" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/gallery"
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
              Save Album
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
