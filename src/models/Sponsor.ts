import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISponsor extends Document {
  name: string;
  slug: string;
  logo?: { url: string; publicId: string };
  description?: string;
  website?: string;
  tier: "specialParticipation" | "platinum" | "gold" | "silver" | "copper" | "media";
  year: number;
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

const SponsorSchema = new Schema<ISponsor>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    logo: { url: String, publicId: String },
    description: { type: String, default: "" },
    website: { type: String, default: "" },
    tier: {
      type: String,
      enum: ["specialParticipation", "platinum", "gold", "silver", "copper", "media"],
      default: "gold",
    },
    year: { type: Number, default: 2027, index: true },
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

SponsorSchema.index({ slug: 1 });
SponsorSchema.index({ year: 1, isDeleted: 1 });
SponsorSchema.index({ isDeleted: 1 });

const Sponsor: Model<ISponsor> =
  mongoose.models.Sponsor || mongoose.model<ISponsor>("Sponsor", SponsorSchema);

export default Sponsor;
