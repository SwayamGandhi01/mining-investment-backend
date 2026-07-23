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
import { speakerSchema, SpeakerInput } from "@/lib/validations/speaker";

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029].map((y) => ({
  label: String(y),
  value: String(y),
}));

export default function EditSpeakerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<SpeakerInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(speakerSchema) as any,
  });

  useEffect(() => {
    const fetchSpeaker = async () => {
      try {
        const res = await axios.get(`/api/speakers/${id}`);
        if (res.data.success) {
          methods.reset(res.data.data);
        }
      } catch {
        toast.error("Failed to load speaker profile");
      } finally {
        setLoading(false);
      }
    };
    fetchSpeaker();
  }, [id, methods]);

  const onSubmit = async (data: SpeakerInput) => {
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/speakers/${id}`, data);
      if (res.data.success) {
        toast.success("Speaker profile updated!");
        router.push("/admin/speakers");
      }
    } catch {
      toast.error("Failed to update speaker profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen text="Loading speaker profile..." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/speakers"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Speaker</h1>
          <p className="text-sm text-muted mt-0.5">Update speaker information</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Profile Information
            </h2>
            <TextField name="name" label="Full Name" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="title" label="Job Title" required />
              <TextField name="company" label="Company / Organization" required />
            </div>
            <TextareaField name="bio" label="Biography" />
            <ImageUploadField name="image" label="Profile Photo" folder="speakers" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Contact & Social Links
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="email" label="Email Address" />
              <TextField name="phone" label="Phone Number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField name="social.linkedin" label="LinkedIn URL" />
              <TextField name="social.twitter" label="Twitter/X URL" />
              <TextField name="social.website" label="Personal Website" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Settings & Display
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
              <TextField name="category" label="Category" placeholder="Keynote / Panelist" />
            </div>
            <TextField name="order" label="Display Order" type="number" />
            <ToggleField name="isFeatured" label="Featured Speaker" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/speakers"
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
              Update Speaker
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
