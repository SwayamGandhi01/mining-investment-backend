import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  content: string;
  year: number;
  startDate: Date;
  endDate: Date;
  location: string;
  venue: string;
  image?: { url: string; publicId: string };
  gallery?: { url: string; publicId: string }[];
  speakers?: mongoose.Types.ObjectId[];
  sponsors?: mongoose.Types.ObjectId[];
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  registrationLink?: string;
  maxAttendees?: number;
  agenda?: Array<{
    day: string;
    date?: string;
    items?: Array<{
      time: string;
      title: string;
      description?: string;
      speaker?: string;
      location?: string;
    }>;
  }>;
  interactiveAgenda?: Array<{
    day: string;
    date?: string;
    items?: Array<{
      time: string;
      title: string;
      description?: string;
      speaker?: string;
      location?: string;
    }>;
  }>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    year: { type: Number, default: 2027, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    image: { url: String, publicId: String },
    gallery: [{ url: String, publicId: String }],
    speakers: [{ type: Schema.Types.ObjectId, ref: "Speaker" }],
    sponsors: [{ type: Schema.Types.ObjectId, ref: "Sponsor" }],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    isFeatured: { type: Boolean, default: false },
    registrationLink: { type: String, default: "" },
    maxAttendees: { type: Number, default: 0 },
    agenda: {
      type: [
        {
          day: { type: String, required: true, trim: true },
          date: { type: String, trim: true },
          items: [
            {
              time: { type: String, required: true, trim: true },
              title: { type: String, required: true, trim: true },
              description: { type: String, trim: true },
              speaker: { type: String, trim: true },
              location: { type: String, trim: true },
            },
          ],
        },
      ],
      default: [],
    },
    interactiveAgenda: {
      type: [
        {
          day: { type: String, required: true, trim: true },
          date: { type: String, trim: true },
          items: [
            {
              time: { type: String, required: true, trim: true },
              title: { type: String, required: true, trim: true },
              description: { type: String, trim: true },
              speaker: { type: String, trim: true },
              location: { type: String, trim: true },
            },
          ],
        },
      ],
      default: [],
    },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EventSchema.index({ slug: 1 });
EventSchema.index({ year: 1, isDeleted: 1 });
EventSchema.index({ status: 1, isDeleted: 1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
