
import { randomBytes } from "node:crypto";
import Joi from "joi";

import Webhook from "../models/Webhook.js";
import {
  validateWebhookUrl,
} from "../services/urlSecurityService.js";

const webhookSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
});

export const createWebhook = async (req, res) => {
  try {
    const { error, value } = webhookSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook details",
        errors: error.details.map((item) => item.message),
      });
    }

    await validateWebhookUrl(value.url);

    const secret = randomBytes(32).toString("hex");

    const webhook = await Webhook.create({
      name: value.name,
      url: value.url,
      secret,
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: "Webhook registered successfully",
      webhook: {
        _id: webhook._id,
        name: webhook.name,
        url: webhook.url,
        active: webhook.active,
        createdAt: webhook.createdAt,
      },
      secret,
      warning: "Store this secret securely. It is displayed only once.",
    });
  } catch (error) {
    console.error("Create webhook error:", error.message);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create webhook",
    });
  }
};

export const getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.find()
      .select("name url active createdAt updatedAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: webhooks.length,
      webhooks,
    });
  } catch (error) {
    console.error("Get webhooks error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve webhooks",
    });
  }
};
