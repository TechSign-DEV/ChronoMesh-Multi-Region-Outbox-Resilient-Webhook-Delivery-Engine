
import express from "express";
import { getDeliveryAttempts } from "../controllers/deliveryController.js";

const router = express.Router();

router.get("/:eventId", getDeliveryAttempts);

export default router;
