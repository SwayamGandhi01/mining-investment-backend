import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

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
  exhibitors: z.array(z.string()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
  registrationLink: z.string().url().optional().or(z.literal("")),
  maxAttendees: z.coerce.number().optional(),
}).merge(seoFieldsSchema);

export type EventInput = z.infer<typeof eventSchema>;
