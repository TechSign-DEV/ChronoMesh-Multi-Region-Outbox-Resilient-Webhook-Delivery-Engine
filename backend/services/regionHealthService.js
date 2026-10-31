
import RegionHealth from "../models/RegionHealth.js";
import { getRegions } from "./regionRegistry.js";

const STALE_AFTER_MS = 60000;

export const recordRegionHeartbeat = async ({
  regionId,
  regionName,
  pendingEvents = 0,
  activeWorkers = 0,
  lastError = null,
} = {}) => {
  if (!regionId || !regionName) {
    throw new Error("Region ID and name are required");
  }

  return RegionHealth.findOneAndUpdate(
    { regionId },
    {
      $set: {
        regionName,
        status: lastError ? "DEGRADED" : "HEALTHY",
        lastHeartbeat: new Date(),
        pendingEvents,
        activeWorkers,
        lastError,
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    }
  );
};

export const getRegionHealth = async () => {
  const configuredRegions = getRegions();

  const records = await RegionHealth.find().lean();

  const healthById = new Map(
    records.map((record) => [record.regionId, record])
  );

  const now = Date.now();

  return configuredRegions.map((region) => {
    const record = healthById.get(region.id);

    if (!record) {
      return {
        regionId: region.id,
        regionName: region.id,
        status: "UNAVAILABLE",
        pendingEvents: 0,
        activeWorkers: 0,
        lastHeartbeat: null,
        lastError: "No heartbeat received",
      };
    }

    const stale =
      now - new Date(record.lastHeartbeat).getTime() >
      STALE_AFTER_MS;

    return {
      ...record,
      status: stale ? "UNAVAILABLE" : record.status,
    };
  });
};
