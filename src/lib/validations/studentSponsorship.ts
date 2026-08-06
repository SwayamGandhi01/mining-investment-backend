import { z } from "zod";

export const studentSponsorshipSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  currentSchool: z.string().min(1, "Current school is required"),
  programAndYear: z.string().optional().default(""),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  // The form checkbox is ticked by default.
  signUpForNews: z.boolean().default(true),
  // Kept as a free string so the form's select can supply its own options
  // without a schema change rejecting live submissions.
  language: z.string().optional().default(""),
  status: z.enum(["pending", "confirmed", "cancelled"]).default("confirmed"),
});

export type StudentSponsorshipInput = z.infer<typeof studentSponsorshipSchema>;
