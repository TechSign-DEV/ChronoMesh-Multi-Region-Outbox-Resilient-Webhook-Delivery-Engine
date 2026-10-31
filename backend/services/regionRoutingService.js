import { getAllRegions } from "./regionRegistry.js";
import regionConfig from "../config/region.js";

export const selectRegionForEvent = (eventId, candidates = getAllRegions()) => {
  if (!candidates.length) {
    return {
      regionId: regionConfig.id,
      regionName: regionConfig.name,
    };
  }

  let selectedRegion = null;
  let highestScore = -1;

  for (const region of candidates) {
    let hash = 2166136261;
    const input = `${eventId}:${region.regionId}`;

    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const score = hash >>> 0;

    if (score > highestScore) {
      highestScore = score;
      selectedRegion = region;
    }
  }

  return selectedRegion;
};

export const getCurrentRegion = () => ({
  regionId: regionConfig.id,
  regionName: regionConfig.name,
});