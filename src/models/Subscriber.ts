import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscriber extends Document {
  fullName: string;
  email: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    fullName: { type: String, required: true, trim: true },
    // Unique so the same address cannot subscribe twice; a repeat signup comes
    // back as a 409 rather than silently creating a duplicate.
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubscriberSchema.index({ email: 1 });
SubscriberSchema.index({ isDeleted: 1 });

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber ||
  mongoose.model<ISubscriber>("Subscriber", SubscriberSchema);

export default Subscriber;
