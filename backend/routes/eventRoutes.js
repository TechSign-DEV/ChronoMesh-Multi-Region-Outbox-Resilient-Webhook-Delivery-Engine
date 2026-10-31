
import express from "express";

import {
  createEvent,
  getEvents,
  getEventById,
} from "../controllers/eventController.js";

const router = express.Router();

router.post("/", createEvent);
router.get("/", getEvents);
router.get("/:eventId", getEventById);

export default router;
