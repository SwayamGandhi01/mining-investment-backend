import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: { url: string; publicId: string };
  category: string;
  tags?: string[];
  author?: mongoose.Types.ObjectId;
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

const BlogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    image: { url: String, publicId: String },
    category: { type: String, required: true, default: "General" },
    tags: [{ type: String }],
    author: { type: Schema.Types.ObjectId, ref: "Admin" },
    publishedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
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

BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, isDeleted: 1 });

const Blog: Model<IBlog> =
  mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema);

export default Blog;
