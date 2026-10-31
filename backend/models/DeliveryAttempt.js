import mongoose from "mongoose";

const deliveryAttemptSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OutboxEvent",
      required: true,
      index: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PROCESSING", "SUCCESS", "FAILED"],
      required: true,
    },
    httpStatus: {
      type: Number,
      default: null,
    },
    responseBody: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

deliveryAttemptSchema.index(
  { eventId: 1, attemptNumber: 1 },
  { unique: true }
);

const DeliveryAttempt = mongoose.model(
  "DeliveryAttempt",
  deliveryAttemptSchema
);

export default DeliveryAttempt;