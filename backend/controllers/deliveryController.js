
import DeliveryAttempt from "../models/DeliveryAttempt.js";
import OutboxEvent from "../models/OutboxEvent.js";

import { webhookQueue } from "../queues/webhookQueue.js";

import { randomUUID } from "node:crypto";

export const getDeliveryAttempts = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    const attempts = await DeliveryAttempt.find({ eventId })
      .sort({ attemptNumber: 1 })
      .select("-responseBody")
      .lean();

    return res.status(200).json({
      success: true,
      eventId,
      count: attempts.length,
      attempts,
    });
  } catch (error) {
    console.error("Delivery attempts error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve delivery attempts",
    });
  }
};

export const retryFailedDelivery = async (req, res) => {
  const { eventId } = req.params;

  let claimedEvent = null;

  try {
    claimedEvent = await OutboxEvent.findOneAndUpdate(
      {
        eventId,
        status: "FAILED",
      },
      {
        $set: {
          status: "PENDING",
          lastError: null,
          leaseOwner: null,
          leaseExpiresAt: null,
        },
      },
      { new: true }
    );

    if (!claimedEvent) {
      return res.status(404).json({
        success: false,
        message: "Failed event not found or already retried",
      });
    }

    const jobId = `manual-${eventId}-${randomUUID()}`;

    try {
      await webhookQueue.add(
        "deliver-webhook",
        { eventId },
        {
          jobId,
          attempts: 5,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: 1000,
          removeOnFail: false,
        }
      );
    } catch (queueError) {
      await OutboxEvent.updateOne(
        {
          _id: claimedEvent._id,
          status: "PENDING",
        },
        {
          $set: {
            status: "FAILED",
            lastError: `Retry enqueue failed: ${queueError.message}`,
          },
        }
      );

      throw queueError;
    }

    return res.status(202).json({
      success: true,
      message: "Manual retry queued",
      eventId,
    });
  } catch (error) {
    console.error("Manual retry error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retry delivery",
    });
  }
};
