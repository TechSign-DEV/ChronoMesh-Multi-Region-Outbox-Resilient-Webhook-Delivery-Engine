
import mongoose from "mongoose";

import OutboxEvent from "../models/OutboxEvent.js";
import Webhook from "../models/Webhook.js";
import { assignRegionForEvent } from "../services/regionAssignmentService.js";

export const createEvent = async (req, res) => {
  try {
    const { eventType, payload, webhookId } = req.body;

    if (
      typeof eventType !== "string" ||
      !eventType.trim() ||
      eventType.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid eventType is required",
      });
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      Array.isArray(payload)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payload must be a JSON object",
      });
    }

    if (!mongoose.isValidObjectId(webhookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook ID",
      });
    }

    const webhook = await Webhook.findOne({
      _id: webhookId,
      active: true,
    }).select("_id");

    if (!webhook) {
      return res.status(404).json({
        success: false,
        message: "Active webhook not found",
      });
    }

    // Generate a stable ID before assigning a region.
    const event = new OutboxEvent({
      eventType: eventType.trim(),
      payload,
      webhook: webhook._id,
    });

    const selectedRegion = await assignRegionForEvent(event.eventId);


if (!selectedRegion?.id) {
  throw new Error("Unable to assign event to a valid region");
}
    event.regionId = selectedRegion.id;

    await event.save();

    return res.status(201).json({
      success: true,
      message: "Event created and assigned to a region",
      event: {
        eventId: event.eventId,
        eventType: event.eventType,
        status: event.status,
        regionId: event.regionId,
        webhook: event.webhook,
        createdAt: event.createdAt,
      },
    });
  } catch (error) {
    console.error("Create event error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create event",
    });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await OutboxEvent.find()
      .select("-payload")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Get events error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve events",
    });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await OutboxEvent.findOne({
      eventId: req.params.eventId,
    }).lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Get event details error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve event",
    });
  }
};
