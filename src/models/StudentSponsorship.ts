import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudentSponsorship extends Document {
  firstName: string;
  lastName: string;
  currentSchool: string;
  programAndYear?: string;
  email: string;
  phone: string;
  signUpForNews: boolean;
  language?: string;
  registrationNumber: string;
  status: "pending" | "confirmed" | "cancelled";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSponsorshipSchema = new Schema<IStudentSponsorship>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    currentSchool: { type: String, required: true, trim: true },
    programAndYear: { type: String, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    signUpForNews: { type: Boolean, default: true },
    language: { type: String, default: "" },
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
