
import mongoose from "mongoose";

const processedWebhookSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    eventId: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PROCESSING", "COMPLETED"],
      default: "PROCESSING",
    },

    responseBody: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model(
  "ProcessedWebhook",
  processedWebhookSchema
);
