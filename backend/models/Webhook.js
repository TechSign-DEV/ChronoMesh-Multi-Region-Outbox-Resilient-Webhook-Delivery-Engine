
import mongoose from "mongoose";

const webhookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
    },

    secret: {
      type: String,
      required: true,
      select: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Webhook", webhookSchema);
