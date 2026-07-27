import { z } from "zod";

export const investorRegistrationSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  businessTitle: z.string().optional().default(""),
  city: z.string().optional().default(""),
  country: z.string().optional().default(""),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional().default(""),
  signUpForNews: z.boolean().default(false),
  assetsUnderManagement: z.string().optional().default(""),
  investorType: z.string().optional().default(""),
  status: z
    .enum(["pending", "confirmed", "cancelled"])
    .default("confirmed"),
});

export type InvestorRegistrationInput = z.infer<
  typeof investorRegistrationSchema
>;
