
import express from "express";
import { receiveWebhook } from "../controllers/testReceiverController.js";

const router = express.Router();

router.post("/", receiveWebhook);

export default router;
