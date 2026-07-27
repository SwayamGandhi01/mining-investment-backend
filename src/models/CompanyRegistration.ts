import mongoose, { Schema, Document, Model } from "mongoose";

export type ProjectStage =
  | "Explorer"
  | "Developer"
  | "Producer"
  | "Royalty"
  | "Project Generator";

export interface ICompanyRegistration extends Document {
  companyName: string;
  marketCap?: string;
  primaryExchangeTicker?: string;
  commodity?: string;
  projectStage?: ProjectStage;
  location?: string;
  email: string;
  signUpForNews: boolean;
  registrationNumber: string;
  status: "pending" | "confirmed" | "cancelled";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanyRegistrationSchema = new Schema<ICompanyRegistration>(
  {
    companyName: { type: String, required: true, trim: true },
    marketCap: { type: String, default: "" },
    primaryExchangeTicker: { type: String, default: "" },
    commodity: { type: String, default: "" },
    projectStage: {
      type: String,
      enum: ["Explorer", "Developer", "Producer", "Royalty", "Project Generator"],
      default: undefined,
    },
    location: { type: String, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    signUpForNews: { type: Boolean, default: false },
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

CompanyRegistrationSchema.index({ registrationNumber: 1 });
CompanyRegistrationSchema.index({ email: 1 });
CompanyRegistrationSchema.index({ isDeleted: 1 });

const CompanyRegistration: Model<ICompanyRegistration> =
  mongoose.models.CompanyRegistration ||
  mongoose.model<ICompanyRegistration>(
    "CompanyRegistration",
    CompanyRegistrationSchema
  );

export default CompanyRegistration;
