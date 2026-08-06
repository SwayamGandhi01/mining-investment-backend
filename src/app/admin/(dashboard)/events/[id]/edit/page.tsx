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
import { RichTextField } from "@/components/forms/RichTextField";
import { DatePickerField } from "@/components/forms/DatePickerField";
import { SelectField } from "@/components/forms/SelectField";
import { ToggleField } from "@/components/forms/ToggleField";
import { ImageUploadField } from "@/components/forms/ImageUploadField";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import InteractiveAgendaEditor from "@/components/admin/InteractiveAgendaEditor";
import { eventSchema, EventInput } from "@/lib/validations/event";
import type { AgendaDay } from "@/lib/agenda";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<EventInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(eventSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      content: "",
      year: 2027,
      startDate: "",
      endDate: "",
      location: "",
      venue: "",
      image: undefined,
      gallery: [],
      speakers: [],
      sponsors: [],
      status: "draft",
      isFeatured: false,
      registrationLink: "",
      maxAttendees: undefined,
      agenda: [],
      interactiveAgenda: [],
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
    },
  });

  const { reset } = methods;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/${id}`);
        if (res.data.success) {
          const data = res.data.data;
          reset({
            ...data,
            interactiveAgenda: Array.isArray(data.interactiveAgenda)
              ? data.interactiveAgenda
              : Array.isArray(data.agenda)
              ? data.agenda
              : [],
          });
        }
      } catch {
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, reset]);

  /** Saves just the agenda, without submitting the rest of the event form. */
  const saveAgenda = async (days: AgendaDay[]) => {
    setSubmitting(true);
    try {
      const res = await axios.patch(`/api/events/${id}`, { interactiveAgenda: days });
      if (res.data.success) {
        toast.success("Agenda saved");
      }
    } catch {
      toast.error("Failed to save agenda");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (data: EventInput) => {
    setSubmitting(true);
    try {
      const res = await axios.put(`/api/events/${id}`, data);
      if (res.data.success) {
        toast.success("Event updated successfully!");
        router.push("/admin/events");
      }
    } catch {
      toast.error("Failed to update event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading event details..." />;
  }

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
          <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
          <p className="text-sm text-muted mt-0.5">Update event details and settings</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <InteractiveAgendaEditor onSave={saveAgenda} saving={submitting} />

        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Basic Information
            </h2>
            <TextField name="title" label="Event Title" required />
            <TextareaField name="description" label="Short Description" required />
            <RichTextField name="content" label="Full Content / Agenda" />
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
              <TextField name="location" label="Location" required />
              <TextField name="venue" label="Venue Name" required />
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
              <TextField name="maxAttendees" label="Max Attendees" type="number" />
            </div>
            <TextField name="registrationLink" label="External Registration Link" />
            <ToggleField name="isFeatured" label="Featured Event" helperText="Show this event in featured sections" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              SEO Optimization
            </h2>
            <TextField name="seoTitle" label="SEO Title" />
            <TextareaField name="seoDescription" label="SEO Description" />
            <TextField name="seoKeywords" label="SEO Keywords" />
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
              Update Event
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
