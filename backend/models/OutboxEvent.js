
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const outboxEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      default: () => randomUUID(),
      unique: true,
      required: true,
      immutable: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "DELIVERED", "FAILED"],
      default: "PENDING",
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastError: {
      type: String,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    webhook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Webhook",
      required: true,
    },

    // Delivery ownership for multi-worker coordination.
    leaseOwner: {
      type: String,
      default: null,
    },

    leaseExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    regionId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

outboxEventSchema.index({ createdAt: -1 });
outboxEventSchema.index({ status: 1, leaseExpiresAt: 1 });

export default mongoose.model("OutboxEvent", outboxEventSchema);
