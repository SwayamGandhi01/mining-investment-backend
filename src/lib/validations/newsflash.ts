import { z } from "zod";
import { imageSchema, seoFieldsSchema } from "@/lib/validators";

export const pdfAttachmentSchema = z.object({
  url: z.string().url("Invalid PDF URL"),
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
    const hasContent = Boolean(data.content?.trim());
    const hasPdf = Boolean(data.pdfAttachment?.url?.trim());
    if (!hasContent && !hasPdf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["content"],
        message: "Content or PDF attachment is required",
      });
    }
  });

export type NewsflashInput = z.infer<typeof newsflashSchema>;
