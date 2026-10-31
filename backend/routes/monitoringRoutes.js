
import express from "express";

import {
  getMonitoringOverview,
  getWorkers,
} from "../controllers/monitoringController.js";

const router = express.Router();

router.get("/overview", getMonitoringOverview);
router.get("/workers", getWorkers);

export default router;
