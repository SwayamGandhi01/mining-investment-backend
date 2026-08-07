"use client";

import { useFormContext, useFieldArray, useWatch, type Control } from "react-hook-form";
import { Plus, Trash2, Clock, Save, Loader2 } from "lucide-react";
import { TextField } from "@/components/forms/TextField";
import { TextareaField } from "@/components/forms/TextareaField";
import {
  sortAgendaDays,
  pruneAgendaDays,
  parseAgendaTime,
  type AgendaDay,
} from "@/lib/agenda";

export const EMPTY_SESSION = { time: "", title: "", speaker: "", location: "", description: "" };

/** A new day opens with one blank session so the fields are there to fill in straight away. */
export const emptyAgendaDay = () => ({
  day: "",
  date: "",
  items: [{ ...EMPTY_SESSION }],
});

/** react-hook-form's Control is generic over the form shape; the agenda paths are the same either way. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgendaControl = Control<any>;

function DayEditor({
  control,
  index,
  removeDay,
}: {
  control: AgendaControl;
  index: number;
  removeDay: (idx: number) => void;
}) {
  const itemsArray = useFieldArray({
    control,
    name: `interactiveAgenda.${index}.items` as const,
  });

  return (
    <div className="p-4 bg-background border border-border rounded-lg space-y-3">
      <div className="flex items-start gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TextField
            name={`interactiveAgenda.${index}.day`}
            label="Day title"
            placeholder="June 1, 2027 - Monday"
          />
          <TextField
            name={`interactiveAgenda.${index}.date`}
            label="Date"
            placeholder="2027-06-01"
          />
        </div>
        <button
          type="button"
          onClick={() => removeDay(index)}
          className="mt-7 shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-danger-500/30 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
        >
          <Trash2 size={14} />
          Remove Day
        </button>
      </div>

      <div className="space-y-3">
        {itemsArray.fields.length === 0 && (
          <p className="text-xs text-muted">
            No sessions in this day yet. Sessions are re-ordered by time when you save.
          </p>
        )}

        {itemsArray.fields.map((field, j) => (
          <div key={field.id} className="p-3 bg-card border border-border rounded-lg space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <TextField
                name={`interactiveAgenda.${index}.items.${j}.time`}
                label="Time"
                placeholder="6:00 PM"
              />
              <TextField
                name={`interactiveAgenda.${index}.items.${j}.title`}
                label="Session title"
                placeholder="Opening Remarks"
              />
              <TextField
                name={`interactiveAgenda.${index}.items.${j}.speaker`}
                label="Speaker"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <TextField
                name={`interactiveAgenda.${index}.items.${j}.location`}
                label="Location"
              />
              <TextareaField
                name={`interactiveAgenda.${index}.items.${j}.description`}
                label="Description"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => itemsArray.remove(j)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-danger-500/30 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/10 transition-colors"
              >
                <Trash2 size={14} />
                Remove Session
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => itemsArray.append({ ...EMPTY_SESSION })}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
        >
          <Plus size={14} />
          Add Session
        </button>
      </div>
    </div>
  );
}

/** Live, always-sorted rendering of what the website will show. */
function AgendaPreview({ days }: { days: AgendaDay[] }) {
  // Placeholder rows are dropped here for the same reason they are dropped on
  // save — a half-typed day should not preview as "Untitled session".
  const sorted = sortAgendaDays(pruneAgendaDays(days));

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Clock size={15} className="text-primary-500" />
        <h3 className="text-sm font-semibold text-foreground">
          Preview — sessions in the order the website will show them
        </h3>
      </div>

      {sorted.map((day, idx) => (
        <div key={idx} className="p-4 bg-background border border-border rounded-lg">
          <p className="font-semibold text-foreground">{day.day || "Untitled day"}</p>
          {day.date && <p className="text-xs text-muted">{day.date}</p>}

          <div className="mt-2 space-y-1.5">
            {(day.items ?? []).map((item, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-2 bg-card border border-border rounded"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.title || "Untitled session"}
                  </p>
                  {item.speaker && (
                    <p className="text-xs text-muted truncate">{item.speaker}</p>
                  )}
                </div>
                <span
                  className={
                    parseAgendaTime(item.time) === null
                      ? "shrink-0 text-xs text-muted italic"
                      : "shrink-0 text-xs font-mono text-foreground"
                  }
                  title={
                    parseAgendaTime(item.time) === null
                      ? "No readable time — sorted to the end of the day"
                      : undefined
                  }
                >
                  {item.time || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Day-and-session builder for an event's interactive agenda.
 *
 * Reads and writes the `interactiveAgenda` field of the surrounding form, so it
 * works on both the create and edit pages. Pass `onSave` to render a standalone
 * save button (the edit page saves the agenda on its own, without submitting the
 * whole event form).
 */
export default function InteractiveAgendaEditor({
  onSave,
  saving = false,
}: {
  onSave?: (days: AgendaDay[]) => void | Promise<void>;
  saving?: boolean;
}) {
  const { control } = useFormContext();
  const daysFieldArray = useFieldArray({ control, name: "interactiveAgenda" as const });

  // Live form values so the preview reflects edits as they are typed.
  const watched = useWatch({ control, name: "interactiveAgenda" }) as AgendaDay[] | undefined;
  const days = Array.isArray(watched) ? watched : [];

  /** Reorder the editor itself so the admin sees the same order as the website. */
  const applySort = () => {
    const sorted = sortAgendaDays(days);
    daysFieldArray.replace(sorted);
    return sorted;
  };

  const addDayButton = (
    <button
      type="button"
      onClick={() => daysFieldArray.append(emptyAgendaDay())}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-card-hover text-foreground transition-colors"
    >
      <Plus size={14} />
      Add Day
    </button>
  );

  const saveButton = onSave ? (
    <button
      type="button"
      disabled={saving}
      onClick={() => onSave(applySort())}
      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {saving ? "Saving..." : "Save Agenda"}
    </button>
  ) : null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      {/*
        The agenda grows thousands of pixels tall, so a save control only at the
        top scrolls out of reach. The header sticks to the top of the scroll area
        while the card is on screen, and the same actions repeat at the bottom.
      */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 px-6 pt-6 pb-3 bg-card rounded-t-xl border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-foreground">Interactive Agenda</h2>
          <p className="text-xs text-muted mt-0.5">
            Add a day, then its sessions. Sessions are sorted by time automatically.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {addDayButton}
          {saveButton}
        </div>
      </div>

      <div className="space-y-4">
        {daysFieldArray.fields.length === 0 && (
          <p className="text-sm text-muted">
            No days yet. Add a day to start building the agenda.
          </p>
        )}
        {daysFieldArray.fields.map((field, idx) => (
          <DayEditor
            key={field.id}
            index={idx}
            control={control}
            removeDay={daysFieldArray.remove}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        {onSave && (
          <p className="mr-auto text-xs text-muted">
            Unsaved changes stay in the form until you save.
          </p>
        )}
        {addDayButton}
        {saveButton}
      </div>

      <AgendaPreview days={days} />
    </div>
  );
}
