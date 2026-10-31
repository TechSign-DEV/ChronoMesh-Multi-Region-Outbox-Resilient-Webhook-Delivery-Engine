
import axios from "axios";

import regionConfig from "../config/region.js";
import { getRegions } from "./regionRegistry.js";
import { recordRegionHeartbeat } from "./regionHealthService.js";
import { webhookQueue } from "../queues/webhookQueue.js";
import WorkerHeartbeat from "../models/WorkerHeartbeat.js";

const HEARTBEAT_INTERVAL = 20000;

let timer = null;
let sending = false;

const getLocalMetrics = async () => {
  const counts = await webhookQueue.getJobCounts(
    "waiting",
    "active",
    "failed",
    "delayed"
  );

  const cutoff = new Date(Date.now() - 45000);

  const workers = await WorkerHeartbeat.find({
    regionId: regionConfig.id,
    status: { $ne: "STOPPED" },
    lastHeartbeat: { $gte: cutoff },
  }).lean();

  return {
    pendingEvents: (counts.waiting || 0) + (counts.delayed || 0),
    activeWorkers: workers.length,
    lastError: null,
  };
};

export const sendRegionHeartbeats = async () => {
  if (sending) return;

  sending = true;

  try {
    const metrics = await getLocalMetrics();

    const heartbeatData = {
      regionId: regionConfig.id,
      regionName: regionConfig.name,
      ...metrics,
    };

    await recordRegionHeartbeat(heartbeatData);

    const token = process.env.REGION_SHARED_TOKEN;

    if (!token) return;

    const peers = getRegions().filter((region) => !region.local);

    await Promise.allSettled(
      peers.map((region) =>
        axios.post(
          `${region.baseUrl}/api/regions/heartbeat`,
          heartbeatData,
          {
            timeout: 5000,
            maxRedirects: 0,
            headers: {
              "X-ChronoMesh-Region-Token": token,
              "Content-Type": "application/json",
            },
          }
        )
      )
    );
  } finally {
    sending = false;
  }
};

export const startRegionHeartbeat = async () => {
  if (timer) return;

  await sendRegionHeartbeats();

  timer = setInterval(() => {
    sendRegionHeartbeats().catch((error) => {
      console.error("Region heartbeat error:", error.message);
    });
  }, HEARTBEAT_INTERVAL);

  console.log("Region heartbeat service started");
};

export const stopRegionHeartbeat = async () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
