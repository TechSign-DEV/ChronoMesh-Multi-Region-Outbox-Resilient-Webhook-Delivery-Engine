
import express from "express";

import {
  createWebhook,
  getWebhooks,
} from "../controllers/webhookController.js";

const router = express.Router();

router.post("/", createWebhook);
router.get("/", getWebhooks);

export default router;
