
import WorkerHeartbeat from "../models/WorkerHeartbeat.js";

import {
  getQueueMetrics,
} from "../services/queueMetricsService.js";

import {
  getRegionHealth,
} from "../services/regionHealthService.js";

export const getMonitoringOverview = async (req, res) => {
  try {
    const [metrics, regions] = await Promise.all([
      getQueueMetrics(),
      getRegionHealth(),
    ]);

    const regionTotals = regions.reduce(
      (totals, region) => {
        totals.total += 1;

        if (region.status === "HEALTHY") {
          totals.healthy += 1;
        } else if (region.status === "DEGRADED") {
          totals.degraded += 1;
        } else {
          totals.unavailable += 1;
        }

        return totals;
      },
      {
        total: 0,
        healthy: 0,
        degraded: 0,
        unavailable: 0,
      }
    );

    return res.status(200).json({
      success: true,
      monitoring: {
        ...metrics,
        regions,
        regionTotals,
      },
    });
  } catch (error) {
    console.error("Monitoring overview error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve monitoring information",
    });
  }
};

export const getWorkers = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 45000);

    const workers = await WorkerHeartbeat.find({
      lastHeartbeat: { $gte: cutoff },
      status: { $ne: "STOPPED" },
    })
      .sort({ lastHeartbeat: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (error) {
    console.error("Worker monitoring error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve workers",
    });
  }
};
