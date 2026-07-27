import { z } from "zod";

export const projectStageEnum = z.enum([
  "Explorer",
  "Developer",
  "Producer",
  "Royalty",
  "Project Generator",
]);

export const companyRegistrationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  marketCap: z.string().optional().default(""),
  primaryExchangeTicker: z.string().optional().default(""),
  commodity: z.string().optional().default(""),
  projectStage: projectStageEnum.optional(),
  location: z.string().optional().default(""),
  email: z.string().email("Valid email is required"),
  signUpForNews: z.boolean().default(false),
  status: z
    .enum(["pending", "confirmed", "cancelled"])
    .default("confirmed"),
});

export type CompanyRegistrationInput = z.infer<
  typeof companyRegistrationSchema
>;
