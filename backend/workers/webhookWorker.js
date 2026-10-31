
import { Worker, UnrecoverableError } from "bullmq";
import axios from "axios";

import OutboxEvent from "../models/OutboxEvent.js";
import Webhook from "../models/Webhook.js";
import DeliveryAttempt from "../models/DeliveryAttempt.js";

import { redisConnection } from "../queues/webhookQueue.js";
import { signPayload } from "../services/signatureService.js";
import { claimEventLease } from "../services/deliveryLeaseService.js";
import { createPinnedHttpAgents } from "../services/pinnedHttpAgents.js";

import {
  isRetryableHttpStatus,
  getDeliveryFailureReason,
} from "../services/deliveryPolicyService.js";

import { registerWorkerRuntime } from "../services/workerRuntime.js";
import regionConfig from "../config/region.js";

const worker = new Worker(
  "webhook-delivery",
  async (job) => {
    const { eventId } = job.data;

    const claim = await claimEventLease(
      eventId,
      regionConfig.id,
      60000
    );

    if (!claim) {
      return {
        skipped: true,
        eventId,
        reason: "Event is leased or assigned to another region",
      };
    }

    const { event, leaseOwner } = claim;

    let attemptRecord = null;
    const startedAt = Date.now();

    try {
      const updatedEvent = await OutboxEvent.findOneAndUpdate(
        {
          _id: event._id,
          leaseOwner,
          status: "PROCESSING",
        },
        { $inc: { attempts: 1 } },
        { new: true }
      );

      if (!updatedEvent) {
        throw new UnrecoverableError(
          "Delivery lease was lost before processing"
        );
      }

      const attemptNumber = updatedEvent.attempts;

      attemptRecord = await DeliveryAttempt.create({
        event: event._id,
        eventId,
        attemptNumber,
        status: "PROCESSING",
        startedAt: new Date(startedAt),
      });

      const webhook = await Webhook.findById(event.webhook)
        .select("+secret");

      if (!webhook || !webhook.active) {
        throw new UnrecoverableError(
          "Webhook does not exist or is inactive"
        );
      }

      const body = JSON.stringify({
        eventId: event.eventId,
        eventType: event.eventType,
        payload: event.payload,
        createdAt: event.createdAt,
      });

      const signature = signPayload(body, webhook.secret);

      const agents = await createPinnedHttpAgents(webhook.url);

      let response;

      try {
        response = await axios.post(webhook.url, body, {
          timeout: 5000,
          maxRedirects: 0,
          proxy: false,
          httpAgent: agents.httpAgent,
          httpsAgent: agents.httpsAgent,
          validateStatus: () => true,
          headers: {
            "Content-Type": "application/json",
            "X-ChronoMesh-Signature": `sha256=${signature}`,
            "X-ChronoMesh-Event-Id": event.eventId,
            "Idempotency-Key": event.eventId,
          },
        });
      } finally {
        agents.destroy();
      }

      const durationMs = Date.now() - startedAt;

      const responseBody =
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data);

      if (response.status < 200 || response.status >= 300) {
        const message = getDeliveryFailureReason(response.status);

        const failure = isRetryableHttpStatus(response.status)
          ? new Error(message)
          : new UnrecoverableError(message);

        failure.httpStatus = response.status;
        failure.responseBody = responseBody;

        throw failure;
      }

      await DeliveryAttempt.findByIdAndUpdate(attemptRecord._id, {
        status: "SUCCESS",
        httpStatus: response.status,
        responseBody: String(responseBody).slice(0, 2000),
        completedAt: new Date(),
        durationMs,
      });

      const completed = await OutboxEvent.findOneAndUpdate(
        {
          _id: event._id,
          leaseOwner,
          status: "PROCESSING",
        },
        {
          $set: {
            status: "DELIVERED",
            deliveredAt: new Date(),
            lastError: null,
            leaseOwner: null,
            leaseExpiresAt: null,
          },
        },
        { new: true }
      );

      if (!completed) {
        throw new Error(
          "Delivery response received, but event lease was lost"
        );
      }

      console.log("Webhook delivered:", eventId);

      return {
        success: true,
        eventId,
        attemptNumber,
        httpStatus: response.status,
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;

      if (attemptRecord) {
        await DeliveryAttempt.findByIdAndUpdate(attemptRecord._id, {
          status: "FAILED",
          httpStatus: error.httpStatus || null,
          responseBody: error.responseBody
            ? String(error.responseBody).slice(0, 2000)
            : null,
          error: error.message,
          completedAt: new Date(),
          durationMs,
        });
      }

      const permanentlyFailed = error instanceof UnrecoverableError;

      await OutboxEvent.findOneAndUpdate(
        {
          _id: event._id,
          leaseOwner,
        },
        {
          $set: {
            status: permanentlyFailed ? "FAILED" : "PENDING",
            lastError: error.message,
            leaseOwner: null,
            leaseExpiresAt: null,
          },
        }
      );

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

registerWorkerRuntime(worker);

worker.on("completed", (job) => {
  console.log("Delivery job completed:", job.data.eventId);
});

worker.on("failed", async (job, error) => {
  if (!job) return;

  console.error(
    "Delivery job failed:",
    job.data.eventId,
    error.message
  );

  const maxAttempts = job.opts.attempts || 1;

  if (job.attemptsMade >= maxAttempts) {
    await OutboxEvent.findOneAndUpdate(
      {
        eventId: job.data.eventId,
        status: { $ne: "DELIVERED" },
      },
      {
        $set: {
          status: "FAILED",
          lastError: error.message,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      }
    );
  }
});

worker.on("error", (error) => {
  console.error("Webhook worker error:", error.message);
});

// Support both default and named imports.
export { worker };
export default worker;
