
import Joi from "joi";
import {
  recordRegionHeartbeat,
  getRegionHealth,
} from "../services/regionHealthService.js";
import { validatePeerRegion } from "../services/peerAuthenticationService.js";

const heartbeatSchema = Joi.object({
  regionId: Joi.string().trim().min(1).max(100).required(),
  regionName: Joi.string().trim().min(1).max(150).required(),
  pendingEvents: Joi.number().integer().min(0).required(),
  activeWorkers: Joi.number().integer().min(0).required(),
});

export const getRegionsStatus = async (req, res, next) => {
  try {
    const regions = await getRegionHealth();

    res.status(200).json({
      success: true,
      count: regions.length,
      regions,
    });
  } catch (error) {
    next(error);
  }
};

export const receiveRegionHeartbeat = async (req, res, next) => {
  try {
    const { error, value } = heartbeatSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Only accept heartbeats from configured remote peers.
    if (!validatePeerRegion(value.regionId)) {
      return res.status(403).json({
        success: false,
        message: "Heartbeat region is not a configured peer",
      });
    }

    await recordRegionHeartbeat(value);

    return res.status(200).json({
      success: true,
      message: "Region heartbeat received",
    });
  } catch (error) {
    next(error);
  }
};

// Backward-compatible controller name used by regionRoutes.js
export const heartbeat = receiveRegionHeartbeat;
