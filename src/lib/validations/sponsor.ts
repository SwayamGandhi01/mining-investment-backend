import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

export const sponsorSchema = z.object({
  name: z.string().min(1, "Sponsor name is required"),
  logo: imageSchema.optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  tier: z.enum(["specialParticipation", "platinum", "gold", "silver", "copper", "media"]).default("gold"),
  year: z.coerce.number().default(2027),
  order: z.coerce.number().default(0),
  status: z.enum(["published", "draft"]).default("published"),
  isFeatured: z.boolean().default(false),
}).merge(seoFieldsSchema);

export type SponsorInput = z.infer<typeof sponsorSchema>;
