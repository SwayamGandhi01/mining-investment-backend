import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document {
  siteName: string;
  siteDescription?: string;
  logo?: { url: string; publicId: string };
  favicon?: { url: string; publicId: string };
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    siteName: { type: String, required: true, default: "Investment Platform" },
    siteDescription: { type: String, default: "Global investment & networking platform" },
    logo: { url: String, publicId: String },
    favicon: { url: String, publicId: String },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    social: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
    },
    defaultSeoTitle: { type: String, default: "" },
    defaultSeoDescription: { type: String, default: "" },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
