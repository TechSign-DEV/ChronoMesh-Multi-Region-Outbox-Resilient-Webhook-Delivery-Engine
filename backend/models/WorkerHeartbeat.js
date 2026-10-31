
import mongoose from "mongoose";

const workerHeartbeatSchema = new mongoose.Schema(
  {
    workerId: {
      type: String,
      required: true,
      unique: true,
    },
    regionId: {
      type: String,
      required: true,
      index: true,
    },
    activeJobs: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["RUNNING", "DEGRADED", "STOPPED"],
      default: "RUNNING",
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now,
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

workerHeartbeatSchema.index({ regionId: 1, lastHeartbeat: -1 });

export default mongoose.model("WorkerHeartbeat", workerHeartbeatSchema);
