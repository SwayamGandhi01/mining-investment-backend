import { z } from "zod";

export const registrationSchema = z.object({
  event: z.string().min(1, "Event is required"),
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  specialRequests: z.string().optional(),
  ticketType: z.string().default("Standard"),
  paymentStatus: z.enum(["pending", "completed", "refunded", "free"]).default("free"),
  status: z.enum(["pending", "confirmed", "cancelled", "attended"]).default("confirmed"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
