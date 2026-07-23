import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRegistration extends Document {
  event: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  dietaryRequirements?: string;
  specialRequests?: string;
  ticketType: string;
  paymentStatus: "pending" | "completed" | "refunded" | "free";
  registrationNumber: string;
  status: "pending" | "confirmed" | "cancelled" | "attended";
  checkedInAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    dietaryRequirements: { type: String, default: "" },
    specialRequests: { type: String, default: "" },
    ticketType: { type: String, default: "Standard" },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "refunded", "free"],
      default: "free",
    },
    registrationNumber: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "attended"],
      default: "confirmed",
    },
    checkedInAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

RegistrationSchema.index({ registrationNumber: 1 });
RegistrationSchema.index({ event: 1, email: 1 });
RegistrationSchema.index({ isDeleted: 1 });

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;
