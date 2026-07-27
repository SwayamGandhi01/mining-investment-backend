import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvestorRegistration extends Document {
  companyName: string;
  firstName: string;
  lastName: string;
  businessTitle?: string;
  city?: string;
  country?: string;
  email: string;
  phone?: string;
  signUpForNews: boolean;
  assetsUnderManagement?: string;
  investorType?: string;
  registrationNumber: string;
  status: "pending" | "confirmed" | "cancelled";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InvestorRegistrationSchema = new Schema<IInvestorRegistration>(
  {
    companyName: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    businessTitle: { type: String, default: "" },
    city: { type: String, default: "" },
    country: { type: String, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    signUpForNews: { type: Boolean, default: false },
    assetsUnderManagement: { type: String, default: "" },
    investorType: { type: String, default: "" },
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

InvestorRegistrationSchema.index({ registrationNumber: 1 });
InvestorRegistrationSchema.index({ email: 1 });
InvestorRegistrationSchema.index({ isDeleted: 1 });

const InvestorRegistration: Model<IInvestorRegistration> =
  mongoose.models.InvestorRegistration ||
  mongoose.model<IInvestorRegistration>(
    "InvestorRegistration",
    InvestorRegistrationSchema
  );

export default InvestorRegistration;
