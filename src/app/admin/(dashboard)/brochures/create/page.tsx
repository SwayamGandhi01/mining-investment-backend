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
import { PdfUploadField } from "@/components/forms/PdfUploadField";
import { brochureSchema, BrochureInput } from "@/lib/validations/brochure";

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029].map((y) => ({
  label: `${y} Edition`,
  value: String(y),
}));

export default function CreateBrochurePage() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const methods = useForm<BrochureInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(brochureSchema) as any,
    defaultValues: {
      title: "",
      year: 2027,
      pdfUrl: "",
      fileSize: "12.4 MB",
      eventDates: "",
      venue: "",
      cityCountry: "",
      description: "",
      status: "published",
    },
  });

  const onSubmit = async (data: BrochureInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/brochures", data);
      if (res.data.success) {
        toast.success("Brochure created successfully!");
        router.push("/admin/brochures");
      }
    } catch {
      toast.error("Failed to create brochure");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/brochures"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Event Brochure</h1>
          <p className="text-sm text-muted mt-0.5">Upload or link a PDF brochure for a specific year edition</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">

          {/* Edition & Core Info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Brochure Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField
                name="year"
                label="Event Edition (Year)"
                options={YEAR_OPTIONS}
              />
              <div className="sm:col-span-2">
                <TextField name="title" label="Brochure Title" required placeholder="Event Brochure 2027" />
              </div>
            </div>
            <TextareaField
              name="description"
              label="Description"
              placeholder="Explore the complete brochure to discover event details, key themes..."
            />
          </div>

          {/* PDF File */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              PDF Document
            </h2>
            <PdfUploadField
              name="pdfUrl"
              label="Brochure PDF Document"
              placeholder="Upload PDF or paste Cloudinary/direct PDF URL"
            />
          </div>

          {/* Event Info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Event Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField name="eventDates" label="Event Dates" placeholder="June 3 – 6, 2027" />
              <TextField name="venue" label="Venue Name" placeholder="Centre des congrès de Québec" />
              <TextField name="cityCountry" label="City, Country" placeholder="Québec City, Canada" />
            </div>
          </div>

          {/* Settings */}
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
              href="/admin/brochures"
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
              Save Brochure
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
