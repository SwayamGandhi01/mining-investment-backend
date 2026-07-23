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
import { DatePickerField } from "@/components/forms/DatePickerField";
import { SelectField } from "@/components/forms/SelectField";
import { ToggleField } from "@/components/forms/ToggleField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import { eventSchema, EventInput } from "@/lib/validations/event";

export default function CreateEventPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<EventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      content: "",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      location: "",
      venue: "",
      status: "draft",
      isFeatured: false,
      registrationLink: "",
      maxAttendees: 100,
    },
  });

  const onSubmit = async (data: EventInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/events", data);
      if (res.data.success) {
        toast.success("Event created successfully!");
        router.push("/admin/events");
      }
    } catch {
      toast.error("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/events"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Event</h1>
          <p className="text-sm text-muted mt-0.5">Add a new event to the platform</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Basic Information
            </h2>
            <TextField name="title" label="Event Title" required placeholder="Annual Investment Summit 2026" />
            <TextareaField name="description" label="Short Description" required placeholder="Brief overview of the event..." />
            <RichTextField name="content" label="Full Content / Agenda" placeholder="Detailed event agenda, rules, and guidelines..." />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Date & Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePickerField name="startDate" label="Start Date & Time" />
              <DatePickerField name="endDate" label="End Date & Time" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="location" label="Location (City/Country)" required placeholder="New York, USA" />
              <TextField name="venue" label="Venue Name" required placeholder="Grand Hyatt Center" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Media & Settings
            </h2>
            <ImageUploadField name="image" label="Cover Image" folder="events" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                name="status"
                label="Publish Status"
                options={[
                  { label: "Draft", value: "draft" },
                  { label: "Published", value: "published" },
                  { label: "Archived", value: "archived" },
                ]}
              />
              <TextField name="maxAttendees" label="Max Attendees" type="number" placeholder="100" />
            </div>
            <TextField name="registrationLink" label="External Registration Link (Optional)" placeholder="https://..." />
            <ToggleField name="isFeatured" label="Featured Event" helperText="Show this event in featured sections" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              SEO Optimization
            </h2>
            <TextField name="seoTitle" label="SEO Title" placeholder="Meta title..." />
            <TextareaField name="seoDescription" label="SEO Description" placeholder="Meta description..." />
            <TextField name="seoKeywords" label="SEO Keywords" placeholder="investment, tech, summit" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/events"
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
              Save Event
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
