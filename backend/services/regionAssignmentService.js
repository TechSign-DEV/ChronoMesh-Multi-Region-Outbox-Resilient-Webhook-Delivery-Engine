
import RegionHealth from "../models/RegionHealth.js";
import { getAllRegions } from "./regionRegistry.js";
import regionConfig from "../config/region.js";
import { selectRegionForEvent } from "./regionRoutingService.js";

const normalizeRegion = (region) => {
  if (!region) return null;

  const id = region.regionId || region.id;

  if (!id) return null;

  return {
    ...region,
    id,
    regionId: id,
    name: region.regionName || region.name || id,
    regionName: region.regionName || region.name || id,
  };
};

export const assignRegionForEvent = async (eventId) => {
  const configuredRegions = getAllRegions();
  const cutoff = new Date(Date.now() - 60 * 1000);

  const healthyRecords = await RegionHealth.find({
    status: "HEALTHY",
    lastHeartbeat: { $gte: cutoff },
  }).select("regionId");

  const healthyIds = new Set(
    healthyRecords.map((record) => record.regionId)
  );

  const healthyRegions = configuredRegions
    .filter((region) => healthyIds.has(region.regionId))
    .map(normalizeRegion)
    .filter(Boolean);

  if (healthyRegions.length > 0) {
    const selected = selectRegionForEvent(
      eventId,
      healthyRegions
    );

    const normalized = normalizeRegion(selected);

    if (normalized) return normalized;
  }

  // No healthy heartbeat yet: use this server's local region.
  const localRegion = configuredRegions.find(
    (region) => region.regionId === regionConfig.id
  );

  return normalizeRegion(
    localRegion || {
      regionId: regionConfig.id,
      regionName: regionConfig.name,
      baseUrl: regionConfig.publicBaseUrl,
    }
  );
};
