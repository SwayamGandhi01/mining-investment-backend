import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExhibitor extends Document {
  name: string;
  slug: string;
  logo?: { url: string; publicId: string };
  description?: string;
  website?: string;
  boothNumber?: string;
  category?: string;
  products?: string[];
  contactPerson?: string;
  contactEmail?: string;
  events?: mongoose.Types.ObjectId[];
  order: number;
  status: "published" | "draft";
  isFeatured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExhibitorSchema = new Schema<IExhibitor>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    logo: { url: String, publicId: String },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    boothNumber: { type: String, default: "" },
    category: { type: String, default: "" },
    products: [{ type: String }],
    contactPerson: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    isFeatured: { type: Boolean, default: false },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ExhibitorSchema.index({ slug: 1 });
ExhibitorSchema.index({ isDeleted: 1 });

const Exhibitor: Model<IExhibitor> =
  mongoose.models.Exhibitor || mongoose.model<IExhibitor>("Exhibitor", ExhibitorSchema);

export default Exhibitor;
