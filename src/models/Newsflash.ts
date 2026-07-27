import mongoose, { Schema, Document, Model } from "mongoose";

export interface INewsflash extends Document {
  title: string;
  slug: string;
  subheading?: string;
  content: string;
  date?: string;
  category: string;
  image?: { url: string; publicId: string };
  pdfAttachment?: { url: string; publicId: string; name?: string };
  publishedAt?: Date;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsflashSchema = new Schema<INewsflash>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    subheading: { type: String, default: "", trim: true },
    content: { type: String, required: true },
    date: { type: String, default: "" },
    category: { type: String, required: true, default: "Newsflash" },
    image: { url: String, publicId: String },
    pdfAttachment: { url: String, publicId: String, name: String },
    publishedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NewsflashSchema.index({ status: 1, isDeleted: 1 });
NewsflashSchema.index({ createdAt: -1 });

const Newsflash: Model<INewsflash> =
  mongoose.models.Newsflash ||
  mongoose.model<INewsflash>("Newsflash", NewsflashSchema);

export default Newsflash;
