import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

export const exhibitorSchema = z.object({
  name: z.string().min(1, "Exhibitor name is required"),
  logo: imageSchema.optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  boothNumber: z.string().optional(),
  category: z.string().optional(),
  products: z.array(z.string()).optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  order: z.coerce.number().default(0),
  status: z.enum(["published", "draft"]).default("published"),
  isFeatured: z.boolean().default(false),
}).merge(seoFieldsSchema);

export type ExhibitorInput = z.infer<typeof exhibitorSchema>;
