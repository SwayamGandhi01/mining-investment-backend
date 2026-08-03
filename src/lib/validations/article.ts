import { z } from "zod";
import { imageSchema } from "@/lib/validators";

export const articleSchema = z.object({
  title: z.string().min(1, "Article title is required").max(200),
  coverImage: imageSchema.optional(),
  pdfUrl: z.string().min(1, "PDF file or URL is required"),
  pdfPublicId: z.string().optional(),
  publishDate: z.coerce.date().default(() => new Date()),
  description: z.string().optional(),
  status: z.enum(["published", "draft"]).default("published"),
});

export type ArticleInput = z.infer<typeof articleSchema>;
