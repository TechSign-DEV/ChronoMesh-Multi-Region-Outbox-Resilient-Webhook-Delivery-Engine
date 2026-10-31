
import express from "express";
import {
  getRegionsStatus,
  receiveRegionHeartbeat,
} from "../controllers/regionController.js";
import { verifyRegionToken } from "../middleware/verifyRegionToken.js";

const router = express.Router();

router.get("/", getRegionsStatus);
router.post("/heartbeat", verifyRegionToken, receiveRegionHeartbeat);

export default router;
