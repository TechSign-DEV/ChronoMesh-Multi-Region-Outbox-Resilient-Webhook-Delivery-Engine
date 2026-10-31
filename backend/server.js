import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import connectDB from "./config/db.js";
import { redisConnection } from "./queues/webhookQueue.js";

import eventRoutes from "./routes/eventRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import regionRoutes from "./routes/regionRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";
import testReceiverRoutes from "./routes/testReceiverRoutes.js";

import { requestId } from "./middleware/requestId.js";
import { webhookRateLimit } from "./middleware/webhookRateLimit.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { startOutboxWatcher } from "./services/outboxWatcher.js";
import { startOutboxReconciler } from "./services/outboxReconciler.js";
import { startRegionHeartbeat } from "./services/regionHeartbeatService.js";
import { startRegionFailoverScheduler } from "./services/regionFailoverScheduler.js";
import { startReceiverRecovery } from "./services/receiverRecoveryScheduler.js";
import { startWorkerHeartbeat } from "./services/workerHeartbeatService.js";
import { gracefulShutdown } from "./services/gracefulShutdown.js";

import { worker } from "./workers/webhookWorker.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(requestId);

app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buffer) => {
      req.rawBody = Buffer.from(buffer);
    },
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "ChronoMesh",
    status: "running",
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/events", eventRoutes);
app.use("/api/webhooks", webhookRateLimit, webhookRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/regions", regionRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/test-receiver", testReceiverRoutes);

app.use(notFound);
app.use(errorHandler);

let server;

const startServer = async () => {
  try {
    await connectDB();

    await redisConnection.ping();
    console.log("Memurai connected successfully");

    await startWorkerHeartbeat();
    await startOutboxWatcher();
    await startOutboxReconciler();
    await startRegionHeartbeat();
    await startRegionFailoverScheduler();
    await startReceiverRecovery();

    const PORT = Number(process.env.PORT || 5000);

    server = app.listen(PORT, () => {
      console.log(`ChronoMesh server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("ChronoMesh startup failed:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown(server, worker));
process.on("SIGTERM", () => gracefulShutdown(server, worker));

startServer();

export default app;