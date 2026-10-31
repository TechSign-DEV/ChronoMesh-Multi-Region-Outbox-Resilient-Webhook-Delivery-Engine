
import ProcessedWebhook from "../models/ProcessedWebhook.js";
import OutboxEvent from "../models/OutboxEvent.js";
import Webhook from "../models/Webhook.js";

import {
  verifyPayloadSignature,
} from "../services/signatureService.js";

export const receiveWebhook = async (req, res) => {
  try {
    const idempotencyKey = req.get("Idempotency-Key");
    const signature = req.get("X-ChronoMesh-Signature");
    const eventId = req.get("X-ChronoMesh-Event-Id");

    if (
      !idempotencyKey ||
      !signature ||
      !eventId ||
      !Buffer.isBuffer(req.rawBody)
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required webhook headers or raw body",
      });
    }

    if (
      idempotencyKey !== eventId ||
      req.body?.eventId !== eventId
    ) {
      return res.status(400).json({
        success: false,
        message: "Event ID and idempotency key do not match",
      });
    }

    const event = await OutboxEvent.findOne({ eventId })
      .select("webhook");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Unknown event",
      });
    }

    const webhook = await Webhook.findById(event.webhook)
      .select("+secret");

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: "Webhook configuration not found",
      });
    }

    const validSignature = verifyPayloadSignature(
      req.rawBody,
      webhook.secret,
      signature
    );

    if (!validSignature) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const existing = await ProcessedWebhook.findOne({
      idempotencyKey,
    });

    if (existing) {
      if (existing.status === "COMPLETED") {
        return res.status(200).json({
          ...existing.responseBody,
          duplicate: true,
        });
      }

      return res.status(409).json({
        success: false,
        message: "Event is already being processed",
      });
    }

    let receipt;

    try {
      receipt = await ProcessedWebhook.create({
        idempotencyKey,
        eventId,
        status: "PROCESSING",
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "Duplicate event claim",
        });
      }

      throw error;
    }

    // Demonstration receiver operation: persist the receipt.
    const result = {
      success: true,
      eventId,
      processed: true,
      message: "Webhook processed successfully",
    };

    receipt.status = "COMPLETED";
    receipt.responseBody = result;
    receipt.processedAt = new Date();

    await receipt.save();

    return res.status(200).json(result);
  } catch (error) {
    console.error("Webhook receiver error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook receiver failed",
    });
  }
};
