
import "dotenv/config";
import mongoose from "mongoose";
import axios from "axios";

import OutboxEvent from "../models/OutboxEvent.js";
import Webhook from "../models/Webhook.js";
import { signPayload } from "../services/signatureService.js";

const EVENT_ID = "564fb92d-6023-43e7-81fa-8d473c884f1e";
const RECEIVER_URL = "http://localhost:5000/api/test-receiver";

const testDuplicateDelivery = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const event = await OutboxEvent.findOne({ eventId: EVENT_ID });

    if (!event) {
      throw new Error("Original event not found");
    }

    const webhook = await Webhook.findById(event.webhook).select("+secret");

    if (!webhook?.secret) {
      throw new Error("Webhook or signing secret not found");
    }

    const body = JSON.stringify({
      eventId: event.eventId,
      eventType: event.eventType,
      payload: event.payload,
      createdAt: event.createdAt,
    });

    const signature = signPayload(body, webhook.secret);

    console.log("Sending the same event again...");

    const response = await axios.post(RECEIVER_URL, body, {
      headers: {
        "Content-Type": "application/json",
        "X-ChronoMesh-Signature": `sha256=${signature}`,
        "X-ChronoMesh-Event-Id": event.eventId,
        "Idempotency-Key": event.eventId,
      },
    });

    console.log("HTTP Status:", response.status);
    console.log("Receiver Response:", response.data);

    if (response.data.duplicate === true) {
      console.log("SUCCESS: Duplicate event detected!");
    } else {
      console.log("CHECK: Receiver did not report a duplicate.");
    }
  } catch (error) {
    console.error(
      "Duplicate test failed:",
      error.response?.data || error.message
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

testDuplicateDelivery();
