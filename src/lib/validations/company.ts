import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  logo: imageSchema.optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  foundedYear: z.coerce.number().optional(),
  employees: z.string().optional(),
  headquarters: z.string().optional(),
  ticker: z.string().optional(),
  type: z.string().optional().default("EXPLORER"),
  location: z.string().optional(),
  commodities: z.array(z.string()).optional().or(
    z.string().transform((val) => val.split(",").map((s) => s.trim()).filter(Boolean))
  ),
  year: z.coerce.number().default(2027),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  social: z
    .object({
      linkedin: z.string().optional(),
      twitter: z.string().optional(),
      facebook: z.string().optional(),
    })
    .optional(),
  status: z.enum(["published", "draft"]).default("published"),
  isFeatured: z.boolean().default(false),
}).merge(seoFieldsSchema);

export type CompanyInput = z.infer<typeof companySchema>;
