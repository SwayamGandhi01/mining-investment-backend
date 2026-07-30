import { z } from "zod";

const agendaItemSchema = z.object({
  time: z.string().min(1, "Time is required"),
  title: z.string().min(1, "Session title is required"),
  description: z.string().optional(),
  speaker: z.string().optional(),
  location: z.string().optional(),
});

const agendaDaySchema = z.object({
  day: z.string().min(1, "Day label is required"),
  date: z.string().optional(),
  items: z.array(agendaItemSchema).default([]),
});

export const agendaSchema = z.object({
  title: z.string().min(1, "Agenda title is required"),
  year: z.coerce.number().default(2027),
  pdfUrl: z.string().optional(),
  pdfPublicId: z.string().optional(),
  scheduleType: z.enum(["pdf", "interactive"]).default("pdf"),
  eventDates: z.string().optional(),
  venue: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["published", "draft"]).default("published"),
  days: z.array(agendaDaySchema).optional(),
  schedule: z.array(agendaDaySchema).optional(),
  agenda: z.array(agendaDaySchema).optional(),
});

export type AgendaInput = z.infer<typeof agendaSchema>;
