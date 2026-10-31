
import os from "node:os";

import WorkerHeartbeat from "../models/WorkerHeartbeat.js";
import regionConfig from "../config/region.js";

const workerId =
  process.env.WORKER_ID ||
  `${os.hostname()}-${process.pid}`;

let activeJobs = 0;
let lastError = null;
let timer = null;

export const changeActiveJobs = (amount) => {
  activeJobs = Math.max(0, activeJobs + amount);
};

export const setWorkerError = (message) => {
  lastError = message || null;
};

export const saveWorkerHeartbeat = async () => {
  return WorkerHeartbeat.findOneAndUpdate(
    { workerId },
    {
      $set: {
        regionId: regionConfig.id,
        activeJobs,
        status: lastError ? "DEGRADED" : "RUNNING",
        lastHeartbeat: new Date(),
        lastError,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

export const startWorkerHeartbeat = async () => {
  if (timer) return;

  await saveWorkerHeartbeat();

  timer = setInterval(() => {
    saveWorkerHeartbeat().catch((error) => {
      console.error("Worker heartbeat error:", error.message);
    });
  }, 15000);

  console.log("Worker heartbeat started:", workerId);
};

export const stopWorkerHeartbeat = async () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  await WorkerHeartbeat.findOneAndUpdate(
    { workerId },
    {
      $set: {
        status: "STOPPED",
        activeJobs: 0,
        lastHeartbeat: new Date(),
      },
    }
  );
};

export const getWorkerId = () => workerId;
