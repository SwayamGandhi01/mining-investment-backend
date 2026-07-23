import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrochure extends Document {
  title: string;
  slug: string;
  year: number;
  pdfUrl: string;
  pdfPublicId?: string;
  fileSize?: string;
  eventDates?: string;
  venue?: string;
  cityCountry?: string;
  description?: string;
  status: "published" | "draft";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrochureSchema = new Schema<IBrochure>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    year: { type: Number, default: 2027, index: true },
    pdfUrl: { type: String, required: true, trim: true },
    pdfPublicId: { type: String, default: "" },
    fileSize: { type: String, default: "12.4 MB" },
    eventDates: { type: String, default: "" },
    venue: { type: String, default: "" },
    cityCountry: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BrochureSchema.index({ slug: 1 });
BrochureSchema.index({ year: 1, isDeleted: 1 });
BrochureSchema.index({ isDeleted: 1 });

const Brochure: Model<IBrochure> =
  mongoose.models.Brochure || mongoose.model<IBrochure>("Brochure", BrochureSchema);

export default Brochure;
