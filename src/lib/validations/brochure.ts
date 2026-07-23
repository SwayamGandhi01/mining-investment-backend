import { z } from "zod";

export const brochureSchema = z.object({
  title: z.string().min(1, "Brochure title is required"),
  year: z.coerce.number().default(2027),
  pdfUrl: z.string().min(1, "PDF file or URL is required"),
  pdfPublicId: z.string().optional(),
  fileSize: z.string().optional().default("12.4 MB"),
  eventDates: z.string().optional(),
  venue: z.string().optional(),
  cityCountry: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["published", "draft"]).default("published"),
});

export type BrochureInput = z.infer<typeof brochureSchema>;
