
import mongoose from "mongoose";

const regionHealthSchema = new mongoose.Schema(
  {
    regionId: {
      type: String,
      required: true,
      unique: true,
    },

    regionName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["HEALTHY", "DEGRADED", "UNAVAILABLE"],
      default: "HEALTHY",
    },

    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },

    pendingEvents: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeWorkers: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default mongoose.model("RegionHealth", regionHealthSchema);
