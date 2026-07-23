import { z } from "zod";
import { imageSchema } from "@/lib/validators";

export const userSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  avatar: imageSchema.optional(),
  bio: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type UserInput = z.infer<typeof userSchema>;
