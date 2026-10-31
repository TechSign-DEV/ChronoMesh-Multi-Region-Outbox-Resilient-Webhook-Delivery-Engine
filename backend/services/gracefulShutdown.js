import mongoose from "mongoose";
import { webhookQueue, redisConnection } from "../queues/webhookQueue.js";
import { stopOutboxWatcher } from "./outboxWatcher.js";
import { stopWorkerHeartbeat } from "./workerHeartbeatService.js";

let shuttingDown = false;

export const gracefulShutdown = async (server, worker) => {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log("ChronoMesh shutdown started...");

  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out; forcing process exit");
    process.exit(1);
  }, 15000);

  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    await stopOutboxWatcher();

    if (worker) {
      await worker.close();
    }

    await stopWorkerHeartbeat();

    await webhookQueue.close();
    await redisConnection.quit();

    await mongoose.disconnect();

    clearTimeout(forceExit);
    console.log("ChronoMesh shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("Shutdown error:", error.message);
    process.exit(1);
  }
};