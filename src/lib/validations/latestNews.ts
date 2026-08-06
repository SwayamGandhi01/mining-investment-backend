import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";
import { DEFAULT_NEWS_CATEGORY } from "@/lib/newsCategories";

export const latestNewsPdfAttachmentSchema = z.object({
  url: z.string().min(1, "Invalid PDF URL").or(z.literal("")).optional(),
  publicId: z.string().optional(),
  name: z.string().optional(),
});

export const latestNewsSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    subheading: z.string().optional().default(""),
    content: z.string().optional().default(""),
    date: z.string().optional().default(""),
    category: z.string().min(1, "Category is required").default(DEFAULT_NEWS_CATEGORY),
    image: imageSchema.optional(),
    pdfAttachment: latestNewsPdfAttachmentSchema.optional(),
    status: z.enum(["draft", "published", "archived"]).default("published"),
    isFeatured: z.boolean().default(false),
    publishedAt: z.coerce.date().optional(),
  })
  .merge(seoFieldsSchema)
  .superRefine((data, ctx) => {
    const hasContent = typeof data.content === "string" && data.content.trim().length > 0;
    const hasPdf =
      !!data.pdfAttachment &&
      typeof data.pdfAttachment.url === "string" &&
      data.pdfAttachment.url.trim().length > 0;

    if (!hasContent && !hasPdf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Content or PDF attachment is required",
      });
    }
  });

export type LatestNewsInput = z.infer<typeof latestNewsSchema>;
