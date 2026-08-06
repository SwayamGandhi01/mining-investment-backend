import { z } from "zod";

export const subscriberSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200),
  email: z.string().email("Valid email is required"),
});

export type SubscriberInput = z.infer<typeof subscriberSchema>;
