"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { TextField } from "@/components/forms/TextField";
import { TextareaField } from "@/components/forms/TextareaField";
import { SelectField } from "@/components/forms/SelectField";
import { PdfUploadField } from "@/components/forms/PdfUploadField";
import { agendaSchema, AgendaInput } from "@/lib/validations/agenda";

const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029].map((y) => ({
  label: `${y} Edition`,
  value: String(y),
}));

const SCHEDULE_TYPE_OPTIONS = [
  { label: "PDF Viewer", value: "pdf" },
  { label: "Interactive Schedule", value: "interactive" },
];

export default function CreateAgendaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const methods = useForm<AgendaInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(agendaSchema) as any,
    defaultValues: {
      title: "",
      year: 2027,
      scheduleType: "pdf",
      pdfUrl: "",
      eventDates: "",
      venue: "",
      description: "",
      status: "published",
      days: [],
    },
  });

  const scheduleType = methods.watch("scheduleType");

  const { control } = methods;
  const daysField = useFieldArray({ control, name: "days" as const });

  function DayItemsEditor({ parentIndex, methods }: { parentIndex: number; methods: any }) {
    const { control } = methods;
    const itemsField = useFieldArray({ control, name: `days.${parentIndex}.items` as any });

    return (
      <div className="space-y-2">
        {itemsField.fields.map((it, idx) => (
          <div key={it.id} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end mb-2">
            <TextField name={`days.${parentIndex}.items.${idx}.time`} label="Time" />
            <TextField name={`days.${parentIndex}.items.${idx}.title`} label="Title" className="sm:col-span-3" />
            <TextField name={`days.${parentIndex}.items.${idx}.speaker`} label="Speaker" />
            <TextField name={`days.${parentIndex}.items.${idx}.location`} label="Location" />
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => itemsField.remove(idx)} className="px-2 py-1 bg-danger-50 text-danger-700 rounded">Remove</button>
            </div>
            <TextareaField name={`days.${parentIndex}.items.${idx}.description`} label="Description" className="sm:col-span-6" rows={2} />
          </div>
        ))}

        <div>
          <button type="button" onClick={() => itemsField.append({ time: "", title: "", description: "", speaker: "", location: "" })} className="px-3 py-2 bg-secondary-600 text-white rounded">
            Add Item
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: AgendaInput) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/agendas", data);
      if (res.data.success) {
        toast.success("Agenda created successfully!");
        router.push("/admin/agendas");
      }
    } catch {
      toast.error("Failed to create agenda");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/agendas"
          className="p-2 border border-border rounded-lg bg-card hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Event Agenda</h1>
          <p className="text-sm text-muted mt-0.5">Upload a PDF schedule or configure an interactive agenda for a specific year edition</p>
        </div>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">

          {/* Core Details */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Agenda Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SelectField name="year" label="Event Edition (Year)" options={YEAR_OPTIONS} />
              <SelectField name="scheduleType" label="Schedule Type" options={SCHEDULE_TYPE_OPTIONS} />
              <div className="sm:col-span-1">
                <SelectField
                  name="status"
                  label="Status"
                  options={[
                    { label: "Published", value: "published" },
                    { label: "Draft", value: "draft" },
                  ]}
                />
              </div>
            </div>
            <TextField
              name="title"
              label="Agenda Title"
              required
              placeholder="Event Agenda 2027"
            />
            <TextareaField
              name="description"
              label="Description"
              placeholder="Four days of keynotes, corporate presentations, panels, and networking..."
            />
          </div>

          {/* PDF Upload (only if pdf type) */}
          {scheduleType === "pdf" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
                PDF Document
              </h2>
              <PdfUploadField
                name="pdfUrl"
                label="Agenda PDF Document"
                placeholder="Upload Agenda PDF or paste Cloudinary/direct PDF URL"
              />
            </div>
          )}

          {/* Interactive Info */}
          {scheduleType === "interactive" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
                Interactive Schedule
              </h2>
              <p className="text-sm text-muted">
                The interactive schedule will be managed through the Events section. Add sessions, keynotes, and presentations there.
              </p>
            </div>
          )}

          {/* Event Info */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">
              Event Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="eventDates" label="Event Dates" placeholder="June 1–4, 2027" />
              <TextField name="venue" label="Venue" placeholder="Centre des congrès de Québec" />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4">
            <Link
              href="/admin/agendas"
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
              Save Agenda
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
