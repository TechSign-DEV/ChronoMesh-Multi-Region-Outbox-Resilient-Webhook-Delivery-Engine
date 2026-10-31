
import { webhookQueue } from "../queues/webhookQueue.js";
import WorkerHeartbeat from "../models/WorkerHeartbeat.js";
import regionConfig from "../config/region.js";

export const getQueueMetrics = async () => {
  const counts = await webhookQueue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused"
  );

  const workers = await WorkerHeartbeat.find({
    regionId: regionConfig.id,
  }).lean();

  const cutoff = new Date(Date.now() - 45000);

  const activeWorkers = workers.filter(
    (worker) =>
      worker.status !== "STOPPED" &&
      new Date(worker.lastHeartbeat) >= cutoff
  );

  return {
    regionId: regionConfig.id,
    queue: {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0,
    },
    workers: {
      total: activeWorkers.length,
      activeJobs: activeWorkers.reduce(
        (total, worker) => total + worker.activeJobs,
        0
      ),
    },
    capturedAt: new Date(),
  };
};
