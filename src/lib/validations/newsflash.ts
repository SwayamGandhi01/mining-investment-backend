import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

export const pdfAttachmentSchema = z.object({
  // Allow empty string for URL so forms that register nested fields
  // (e.g. "pdfAttachment.url") but leave them blank don't fail validation.
  // Accept non-absolute URLs/paths as well (some uploads return relative paths).
  // Empty string will be treated as "no PDF provided" by the superRefine check.
  url: z.string().min(1, "Invalid PDF URL").or(z.literal("")).optional(),
  publicId: z.string().optional(),
  name: z.string().optional(),
});

export const newsflashSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    subheading: z.string().optional().default(""),
    content: z.string().optional().default(""),
    date: z.string().optional().default(""),
    category: z.string().default("Newsflash"),
    image: imageSchema.optional(),
    pdfAttachment: pdfAttachmentSchema.optional(),
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

export type NewsflashInput = z.infer<typeof newsflashSchema>;
