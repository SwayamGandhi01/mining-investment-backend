import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAgenda extends Document {
  title: string;
  slug: string;
  year: number;
  pdfUrl?: string;
  pdfPublicId?: string;
  scheduleType: "pdf" | "interactive";
  eventDates?: string;
  venue?: string;
  description?: string;
  status: "published" | "draft";
  days?: Array<{
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
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AgendaSchema = new Schema<IAgenda>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    year: { type: Number, default: 2027, index: true },
    pdfUrl: { type: String, default: "" },
    pdfPublicId: { type: String, default: "" },
    scheduleType: {
      type: String,
      enum: ["pdf", "interactive"],
      default: "pdf",
    },
    eventDates: { type: String, default: "" },
    venue: { type: String, default: "" },
    description: { type: String, default: "" },
    status: { type: String, enum: ["published", "draft"], default: "published" },
    days: {
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
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

AgendaSchema.index({ slug: 1 });
AgendaSchema.index({ year: 1, isDeleted: 1 });
AgendaSchema.index({ isDeleted: 1 });

const Agenda: Model<IAgenda> =
  mongoose.models.Agenda || mongoose.model<IAgenda>("Agenda", AgendaSchema);

export default Agenda;
