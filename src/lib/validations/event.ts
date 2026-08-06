import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";
import { pruneAgendaDays, type AgendaDay } from "@/lib/agenda";

const eventAgendaItemSchema = z.object({
  time: z.string().min(1, "Time is required"),
  title: z.string().min(1, "Session title is required"),
  description: z.string().optional(),
  speaker: z.string().optional(),
  location: z.string().optional(),
});

const eventAgendaDaySchema = z.object({
  day: z.string().min(1, "Day label is required"),
  date: z.string().optional(),
  items: z.array(eventAgendaItemSchema).default([]),
});

/**
 * Untouched days and sessions are dropped before the rules below are applied, so
 * the create form's blank starter row never blocks a save. A session the admin
 * did start filling in is still held to the required time/title rules.
 */
const eventAgendaSchema = z.preprocess(
  (value) => (Array.isArray(value) ? pruneAgendaDays(value as AgendaDay[]) : value),
  z.array(eventAgendaDaySchema)
);

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required"),
  content: z.string().optional(),
  year: z.coerce.number().default(2027),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  location: z.string().min(1, "Location is required"),
  venue: z.string().min(1, "Venue is required"),
  image: imageSchema.optional(),
  gallery: z.array(imageSchema).optional(),
  speakers: z.array(z.string()).optional(),
  sponsors: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  registrationLink: z.string().url().optional().or(z.literal("")),
  maxAttendees: z.coerce.number().optional(),
  agenda: eventAgendaSchema.optional(),
  interactiveAgenda: eventAgendaSchema.optional(),
}).merge(seoFieldsSchema);

export type EventInput = z.infer<typeof eventSchema>;
