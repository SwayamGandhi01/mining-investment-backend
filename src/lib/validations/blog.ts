import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

export const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  image: imageSchema.optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).optional(),
  publishedAt: z.string().or(z.date()).optional(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isFeatured: z.boolean().default(false),
}).merge(seoFieldsSchema);

export type BlogInput = z.infer<typeof blogSchema>;
