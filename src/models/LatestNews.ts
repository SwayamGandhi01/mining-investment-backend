import mongoose, { Schema, Document, Model } from "mongoose";
import { DEFAULT_NEWS_CATEGORY } from "@/lib/newsCategories";

export interface ILatestNews extends Document {
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

const LatestNewsSchema = new Schema<ILatestNews>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    subheading: { type: String, default: "", trim: true },
    content: { type: String, required: true },
    date: { type: String, default: "" },
    // Free string rather than an enum so existing items keep their category and
    // adding a section does not need a migration. The selectable list lives in
    // src/lib/newsCategories.ts.
    category: { type: String, required: true, default: DEFAULT_NEWS_CATEGORY },
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

LatestNewsSchema.index({ slug: 1 });
LatestNewsSchema.index({ status: 1, isDeleted: 1 });
LatestNewsSchema.index({ createdAt: -1 });

const LatestNews: Model<ILatestNews> =
  mongoose.models.LatestNews ||
  mongoose.model<ILatestNews>("LatestNews", LatestNewsSchema);

export default LatestNews;
