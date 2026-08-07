import { z } from "zod";

/** Resume / letter-of-interest attachment, as returned by the upload endpoint. */
const attachmentSchema = z.object({
  url: z.string().min(1, "Attachment url is required"),
  publicId: z.string().optional().default(""),
  fileName: z.string().optional().default(""),
});

export const studentSponsorshipSchema = z.object({
  // Section 1 — Personal Information
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),

  // Section 2 — Academic & Language Profile
  currentSchool: z.string().min(1, "Current school / institution is required"),
  programAndYear: z.string().min(1, "Program & year of study is required"),
  // Kept as a free string so the form's select can supply its own options
  // without a schema change rejecting live submissions.
  language: z.string().optional().default(""),

  // Section 3 — Resume & Letter of Interest. The form presents the letter as
  // "type it, or attach a file", and neither is marked required, so both are
  // optional here rather than inventing a cross-field rule the form does not
  // enforce.
  resume: attachmentSchema.optional(),
  letterOfInterest: z.string().optional().default(""),
  letterOfInterestFile: attachmentSchema.optional(),

  // The form checkbox is ticked by default.
  signUpForNews: z.boolean().default(true),

  status: z.enum(["pending", "confirmed", "cancelled"]).default("confirmed"),
});

export type StudentSponsorshipInput = z.infer<typeof studentSponsorshipSchema>;

/** File types the resume and letter-of-interest uploads accept. */
export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx"];

export function isAcceptedDocument(file: { name: string; type: string }): boolean {
  const name = file.name.toLowerCase();
  return (
    DOCUMENT_MIME_TYPES.includes(file.type) ||
    DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext))
  );
}
