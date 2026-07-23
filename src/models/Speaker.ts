import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISpeaker extends Document {
  name: string;
  slug: string;
  title: string;
  company: string;
  bio: string;
  category?: string;
  year: number;
  image?: { url: string; publicId: string };
  email?: string;
  phone?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
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

const SpeakerSchema = new Schema<ISpeaker>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    bio: { type: String, default: "" },
    category: { type: String, default: "Speaker" },
    year: { type: Number, default: 2027, index: true },
    image: { url: String, publicId: String },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    social: {
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      website: { type: String, default: "" },
    },
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

SpeakerSchema.index({ slug: 1 });
SpeakerSchema.index({ year: 1, isDeleted: 1 });
SpeakerSchema.index({ isDeleted: 1 });

const Speaker: Model<ISpeaker> =
  mongoose.models.Speaker || mongoose.model<ISpeaker>("Speaker", SpeakerSchema);

export default Speaker;
