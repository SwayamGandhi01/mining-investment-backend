import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

export const speakerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  bio: z.string().optional(),
  category: z.string().optional().default("Speaker"),
  year: z.coerce.number().default(2027),
  image: imageSchema.optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  social: z
    .object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  order: z.coerce.number().default(0),
  status: z.enum(["published", "draft"]).default("published"),
  isFeatured: z.boolean().default(false),
}).merge(seoFieldsSchema);

export type SpeakerInput = z.infer<typeof speakerSchema>;
