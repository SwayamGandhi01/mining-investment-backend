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
import { companySchema, CompanyInput } from "@/lib/validations/company";

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029].map((y) => ({
  label: String(y),
  value: String(y),
}));

const COMPANY_TYPE_OPTIONS = [
  { label: "Explorer", value: "EXPLORER" },
  { label: "Developer", value: "DEVELOPER" },
  { label: "Producer", value: "PRODUCER" },
  { label: "Service Provider", value: "SERVICE PROVIDER" },
  { label: "Royalty Company", value: "ROYALTY" },
  { label: "Investor", value: "INVESTOR" },
];

export default function CreateCompanyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<CompanyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(companySchema) as any,
    defaultValues: {
      name: "",
      ticker: "",
      type: "EXPLORER",
      location: "",
      commodities: [],
      year: 2027,
      industry: "",
      headquarters: "",
      website: "",
      description: "",
      status: "published",
      isFeatured: false,
    },
  });

  const onSubmit = async (data: CompanyInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/companies", data);
      if (res.data.success) {
        toast.success("Company profile created successfully!");
        router.push("/admin/companies");
      }
    } catch {
      toast.error("Failed to create company");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/companies"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Company</h1>
          <p className="text-sm text-muted mt-0.5">Register a new firm or company profile</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Company Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="name" label="Company Name" required placeholder="1844 Resources Inc." />
              <TextField name="ticker" label="Stock Ticker" placeholder="TSX-V: EFF" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField name="type" label="Company Type" options={COMPANY_TYPE_OPTIONS} />
              <TextField name="location" label="Location" placeholder="CANADA/QC" />
              <TextField name="commodities" label="Commodities (comma-separated)" placeholder="Cu, Pb, Zn, Ag" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="industry" label="Industry Sector" placeholder="Mining / Exploration" />
              <TextField name="headquarters" label="Headquarters" placeholder="Quebec City, QC" />
            </div>
            <TextareaField name="description" label="Company Description" />
            <ImageUploadField name="logo" label="Company Logo" folder="companies" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Corporate Details &amp; Contact
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField name="website" label="Website URL" placeholder="https://..." />
              <TextField name="contactEmail" label="Contact Email" placeholder="info@company.com" />
              <TextField name="contactPhone" label="Contact Phone" placeholder="+1 (555) 000-0000" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Settings &amp; Edition
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
            <ToggleField name="isFeatured" label="Featured Company" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/companies"
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
              Save Company
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
