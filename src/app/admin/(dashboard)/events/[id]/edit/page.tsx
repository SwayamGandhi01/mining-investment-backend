"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, useFieldArray, useWatch } from "react-hook-form";
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
import { eventSchema, EventInput } from "@/lib/validations/event";

const addSessionItem = { time: "", title: "", speaker: "", location: "", description: "" };

function DayEditor({
  control,
  index,
  removeDay,
}: {
  control: any;
  index: number;
  removeDay: (idx: number) => void;
}) {
  const itemsArray = useFieldArray({ control, name: `interactiveAgenda.${index}.items` as const });

  return (
    <div className="p-4 bg-muted rounded-md">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <TextField name={`interactiveAgenda.${index}.day`} label="Day title" />
          <TextField name={`interactiveAgenda.${index}.date`} label="Date (e.g. 2027-06-14)" />
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => removeDay(index)}>
            Remove Day
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {itemsArray.fields.map((it, j) => (
          <div key={it.id} className="p-2 bg-card border border-border rounded">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <TextField name={`interactiveAgenda.${index}.items.${j}.time`} label="Time" />
              <TextField name={`interactiveAgenda.${index}.items.${j}.title`} label="Session title" />
              <TextField name={`interactiveAgenda.${index}.items.${j}.speaker`} label="Speaker" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <TextField name={`interactiveAgenda.${index}.items.${j}.location`} label="Location" />
              <TextareaField name={`interactiveAgenda.${index}.items.${j}.description`} label="Description" />
            </div>
            <div className="flex justify-end mt-2">
              <button type="button" className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => itemsArray.remove(j)}>
                Remove
              </button>
            </div>
          </div>
        ))}

        <div>
          <button
            type="button"
            className="px-3 py-2 bg-green-600 text-white rounded"
            onClick={() => itemsArray.append(addSessionItem)}
          >
            Add Session
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agendaPreview, setAgendaPreview] = useState<any[]>([]);

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
      exhibitors: [],
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

  const { control, reset, getValues } = methods;
  useWatch({ control, name: "interactiveAgenda" });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/api/events/${id}`);
        if (res.data.success) {
          const data = res.data.data as any;
          const resetData = {
            ...data,
            interactiveAgenda: Array.isArray(data.interactiveAgenda) ? data.interactiveAgenda : [],
          };
          reset(resetData);
          // prepare a user-friendly agenda preview (prefer interactiveAgenda)
          setAgendaPreview(
            Array.isArray(resetData.interactiveAgenda) && resetData.interactiveAgenda.length
              ? resetData.interactiveAgenda
              : Array.isArray(resetData.agenda)
              ? resetData.agenda
              : []
          );
        }
      } catch {
        toast.error("Failed to load event details");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, reset]);

  // top-level days field array
  const daysFieldArray = useFieldArray({ control, name: "interactiveAgenda" as const });

  const saveAgenda = async () => {
    const data = getValues();
    setSubmitting(true);
    try {
      const res = await axios.patch(`/api/events/${id}`, { interactiveAgenda: data.interactiveAgenda });
      if (res.data.success) {
        toast.success("Agenda saved");
        // update preview from returned data if present
        setAgendaPreview(res.data.data?.interactiveAgenda ?? data.interactiveAgenda ?? []);
      }
    } catch (err) {
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
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Edit Interactive Agenda</h2>
            <div className="flex items-center gap-2">
              <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => daysFieldArray.append({ day: "Day", date: "", items: [] })}>Add Day</button>
              <button type="button" className="px-3 py-2 bg-primary-600 text-white rounded" onClick={saveAgenda} disabled={submitting}>{submitting ? "Saving..." : "Save Agenda"}</button>
            </div>
          </div>

          <div className="space-y-4">
            {daysFieldArray.fields.length === 0 && <div className="text-sm text-muted">No days yet. Add a day to start building the agenda.</div>}
            {daysFieldArray.fields.map((d, idx) => (
              <DayEditor key={d.id} index={idx} control={control} removeDay={daysFieldArray.remove} />
            ))}
          </div>
        </div>
        {agendaPreview.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">Interactive Agenda Preview</h2>
            <div className="space-y-4">
              {agendaPreview.map((day, idx) => (
                <div key={idx} className="p-4 bg-muted rounded-md">
                  <h3 className="font-semibold">{day.day}</h3>
                  <p className="text-sm text-muted mb-2">{day.date}</p>
                  <div className="space-y-2">
                    {Array.isArray(day.items) && day.items.map((it: any, i: number) => (
                      <div key={i} className="p-2 bg-card border border-border rounded">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{it.title}</div>
                          <div className="text-sm text-muted">{it.time}</div>
                        </div>
                        {it.speaker && <div className="text-sm text-muted">Speaker: {it.speaker}</div>}
                        {it.location && <div className="text-sm text-muted">Location: {it.location}</div>}
                        {it.description && <div className="text-sm mt-1">{it.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
