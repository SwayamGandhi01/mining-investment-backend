import { z } from "zod";
import { imageSchema } from "@/lib/validators";

const galleryImageSchema = imageSchema.extend({
  caption: z.string().optional(),
  order: z.coerce.number().optional(),
});

export const gallerySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  images: z.array(galleryImageSchema).min(1, "At least one image is required"),
  category: z.string().default("General"),
  event: z.string().optional(),
  status: z.enum(["published", "draft"]).default("published"),
  isFeatured: z.boolean().default(false),
});

export type GalleryInput = z.infer<typeof gallerySchema>;
