import mongoose, { Schema, Document, Model } from "mongoose";

/** A stored resume or letter-of-interest document (PDF/DOC/DOCX). */
export interface ISponsorshipAttachment {
  url: string;
  publicId: string;
  fileName: string;
}

export interface IStudentSponsorship extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  currentSchool: string;
  programAndYear: string;
  language?: string;
  resume?: ISponsorshipAttachment;
  letterOfInterest?: string;
  letterOfInterestFile?: ISponsorshipAttachment;
  signUpForNews: boolean;
  registrationNumber: string;
  status: "pending" | "confirmed" | "cancelled";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// _id: false — these are plain value objects, not separately addressable docs.
const AttachmentSchema = new Schema<ISponsorshipAttachment>(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: "" },
    fileName: { type: String, default: "" },
  },
  { _id: false }
);

const StudentSponsorshipSchema = new Schema<IStudentSponsorship>(
  {
    // Section 1 — Personal Information
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },

    // Section 2 — Academic & Language Profile
    currentSchool: { type: String, required: true, trim: true },
    programAndYear: { type: String, required: true, trim: true },
    // Free-form so the form's select can add options without a schema change
    // rejecting live submissions.
    language: { type: String, default: "" },

    // Section 3 — Resume & Letter of Interest. The form offers the letter as
    // either typed text or an attached file, so both are optional.
    resume: { type: AttachmentSchema, default: undefined },
    letterOfInterest: { type: String, default: "" },
    letterOfInterestFile: { type: AttachmentSchema, default: undefined },

    // The form checkbox is ticked by default.
    signUpForNews: { type: Boolean, default: true },

    registrationNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

StudentSponsorshipSchema.index({ registrationNumber: 1 });
StudentSponsorshipSchema.index({ email: 1 });
StudentSponsorshipSchema.index({ isDeleted: 1 });

const StudentSponsorship: Model<IStudentSponsorship> =
  mongoose.models.StudentSponsorship ||
  mongoose.model<IStudentSponsorship>(
    "StudentSponsorship",
    StudentSponsorshipSchema
  );

export default StudentSponsorship;
