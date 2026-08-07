import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  slug: string;
  logo?: { url: string; publicId: string };
  description?: string;
  website?: string;
  industry?: string;
  foundedYear?: number;
  employees?: string;
  headquarters?: string;
  ticker?: string;
  type?: string;
  location?: string;
  commodities?: string[];
  year: number;
  contactEmail?: string;
  contactPhone?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  status: "published" | "draft";
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    logo: { url: String, publicId: String },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    industry: { type: String, default: "" },
    foundedYear: { type: Number },
    employees: { type: String, default: "" },
    headquarters: { type: String, default: "" },
    ticker: { type: String, default: "" },
    type: { type: String, default: "EXPLORER" },
    location: { type: String, default: "" },
    commodities: [{ type: String }],
    year: { type: Number, default: 2027, index: true },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    social: {
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      facebook: { type: String, default: "" },
    },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CompanySchema.index({ slug: 1 });
// Companies are listed alphabetically by default.
CompanySchema.index({ name: 1 });
CompanySchema.index({ year: 1, isDeleted: 1 });
CompanySchema.index({ isDeleted: 1 });

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
