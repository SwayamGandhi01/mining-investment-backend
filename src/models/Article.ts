import mongoose, { Schema, Document, Model } from "mongoose";

export interface IArticle extends Document {
  title: string;
  slug: string;
  coverImage?: { url: string; publicId: string };
  pdfUrl: string;
  pdfPublicId?: string;
  publishDate: Date;
  description?: string;
  status: "published" | "draft";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    coverImage: { url: String, publicId: String },
    pdfUrl: { type: String, required: true, trim: true },
    pdfPublicId: { type: String, default: "" },
    publishDate: { type: Date, default: Date.now, index: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ArticleSchema.index({ slug: 1 });
ArticleSchema.index({ status: 1, isDeleted: 1 });
ArticleSchema.index({ publishDate: -1, isDeleted: 1 });

const Article: Model<IArticle> =
  mongoose.models.Article || mongoose.model<IArticle>("Article", ArticleSchema);

export default Article;
