
import {
  changeActiveJobs,
  setWorkerError,
} from "./workerHeartbeatService.js";

export const registerWorkerRuntime = (worker) => {
  worker.on("active", () => {
    changeActiveJobs(1);
  });

  worker.on("completed", () => {
    changeActiveJobs(-1);
    setWorkerError(null);
  });

  worker.on("failed", (job, error) => {
    changeActiveJobs(-1);
    setWorkerError(error?.message || "Delivery failed");
  });

  worker.on("error", (error) => {
    setWorkerError(error.message);
    console.error("Worker runtime error:", error.message);
  });
};
