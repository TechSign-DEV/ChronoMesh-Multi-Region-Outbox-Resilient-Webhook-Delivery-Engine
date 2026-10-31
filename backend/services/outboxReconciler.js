
import OutboxEvent from "../models/OutboxEvent.js";
import DeliveryAttempt from "../models/DeliveryAttempt.js";

import { webhookQueue } from "../queues/webhookQueue.js";
import { assignRegionForEvent } from "./regionAssignmentService.js";

import regionConfig from "../config/region.js";

const RECONCILE_INTERVAL = 30000;
const BATCH_LIMIT = 500;
const STALE_LEASE_MS = 120000;

let timer = null;
let running = false;

export const reconcileOutbox = async () => {
  if (running) return;

  running = true;

  try {
    // Assign old events using the configured region strategy.
    const unassigned = await OutboxEvent.find({
      regionId: null,
      status: "PENDING",
    })
      .select("_id eventId")
      .limit(BATCH_LIMIT)
      .lean();

    for (const event of unassigned) {
    const region = await assignRegionForEvent(event.eventId);

if (!region?.id) {
  console.error("No valid region assigned:", event.eventId);
  continue;
}
      await OutboxEvent.updateOne(
        {
          _id: event._id,
          regionId: null,
          status: "PENDING",
        },
        {
          $set: { regionId: region.id },
        }
      );
    }

    const staleBefore = new Date(Date.now() - STALE_LEASE_MS);

    const staleEvents = await OutboxEvent.find({
      regionId: regionConfig.id,
      status: "PROCESSING",
      $or: [
        { leaseExpiresAt: null },
        { leaseExpiresAt: { $lte: new Date() } },
        {
          leaseExpiresAt: { $exists: false },
          updatedAt: { $lte: staleBefore },
        },
      ],
    })
      .select("_id eventId")
      .limit(BATCH_LIMIT)
      .lean();

    for (const event of staleEvents) {
      await DeliveryAttempt.updateMany(
        {
          eventId: event.eventId,
          status: "PROCESSING",
        },
        {
          $set: {
            status: "FAILED",
            error: "Worker lease expired before completion",
            completedAt: new Date(),
          },
        }
      );

      await OutboxEvent.updateOne(
        {
          _id: event._id,
          status: "PROCESSING",
          regionId: regionConfig.id,
          $or: [
            { leaseExpiresAt: null },
            { leaseExpiresAt: { $lte: new Date() } },
            {
              leaseExpiresAt: { $exists: false },
              updatedAt: { $lte: staleBefore },
            },
          ],
        },
        {
          $set: {
            status: "PENDING",
            leaseOwner: null,
            leaseExpiresAt: null,
            lastError: "Recovered after delivery lease expiration",
          },
        }
      );
    }

    const events = await OutboxEvent.find({
      regionId: regionConfig.id,
      status: "PENDING",
    })
      .sort({ createdAt: 1 })
      .limit(BATCH_LIMIT)
      .select("eventId")
      .lean();

    for (const event of events) {
      try {
        const existing = await webhookQueue.getJob(event.eventId);

        if (existing) {
          const state = await existing.getState();

          if (
            ["active", "waiting", "delayed", "waiting-children", "prioritized"].includes(state)
          ) {
            continue;
          }

          if (state === "completed") {
            await existing.remove();
          } else if (state === "failed") {
            continue;
          }
        }

        await webhookQueue.add(
          "deliver-webhook",
          { eventId: event.eventId },
          {
            jobId: event.eventId,
            attempts: 5,
            backoff: {
              type: "exponential",
              delay: 1000,
            },
            removeOnComplete: 1000,
            removeOnFail: false,
          }
        );
      } catch (error) {
        console.error(
          "Reconciliation error:",
          event.eventId,
          error.message
        );
      }
    }
  } finally {
    running = false;
  }
};

export const startOutboxReconciler = async () => {
  if (timer) return;

  await reconcileOutbox();

  timer = setInterval(() => {
    reconcileOutbox().catch((error) => {
      console.error("Outbox reconciler failed:", error.message);
    });
  }, RECONCILE_INTERVAL);

  console.log("Outbox reconciler started");
};

export const stopOutboxReconciler = async () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
