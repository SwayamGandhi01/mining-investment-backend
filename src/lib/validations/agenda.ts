import { z } from "zod";

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
});

export type AgendaInput = z.infer<typeof agendaSchema>;
