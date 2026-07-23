import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGalleryItem {
  url: string;
  publicId: string;
  caption?: string;
  order?: number;
}

export interface IGallery extends Document {
  title: string;
  slug: string;
  description?: string;
  images: IGalleryItem[];
  event?: mongoose.Types.ObjectId;
  category?: string;
  status: "published" | "draft";
  isFeatured: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GallerySchema = new Schema<IGallery>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: "" },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        caption: { type: String, default: "" },
        order: { type: Number, default: 0 },
      },
    ],
    event: { type: Schema.Types.ObjectId, ref: "Event" },
    category: { type: String, default: "General" },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

GallerySchema.index({ slug: 1 });
GallerySchema.index({ isDeleted: 1 });

const Gallery: Model<IGallery> =
  mongoose.models.Gallery || mongoose.model<IGallery>("Gallery", GallerySchema);

export default Gallery;
