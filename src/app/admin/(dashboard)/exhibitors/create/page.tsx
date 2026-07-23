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
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { exhibitorSchema, ExhibitorInput } from "@/lib/validations/exhibitor";

export default function CreateExhibitorPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<ExhibitorInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(exhibitorSchema) as any,
    defaultValues: {
      name: "",
      boothNumber: "",
      category: "",
      description: "",
      website: "",
      contactPerson: "",
      contactEmail: "",
      status: "published",
      isFeatured: false,
    },
  });

  const onSubmit = async (data: ExhibitorInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/exhibitors", data);
      if (res.data.success) {
        toast.success("Exhibitor created successfully!");
        router.push("/admin/exhibitors");
      }
    } catch {
      toast.error("Failed to create exhibitor");
    } finally {
      setSubmitting(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground">Add Exhibitor</h1>
          <p className="text-sm text-muted mt-0.5">Register a new booth exhibitor</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Exhibitor Profile
            </h2>
            <TextField name="name" label="Exhibitor / Company Name" required placeholder="TechNova Labs" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="boothNumber" label="Booth Number" placeholder="A-102" />
              <TextField name="category" label="Category / Industry" placeholder="Fintech / AI" />
            </div>
            <TextareaField name="description" label="Boasting Description" placeholder="What this exhibitor showcases..." />
            <ImageUploadField name="logo" label="Logo Image" folder="exhibitors" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Contact & Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField name="contactPerson" label="Contact Person" placeholder="John Doe" />
              <TextField name="contactEmail" label="Contact Email" placeholder="john@technova.com" />
              <TextField name="website" label="Website URL" placeholder="https://..." />
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
              Save Exhibitor
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
