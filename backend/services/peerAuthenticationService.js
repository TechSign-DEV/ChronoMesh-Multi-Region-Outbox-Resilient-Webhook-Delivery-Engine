import { getPeerRegions } from "./regionRegistry.js";

export const validatePeerRegion = (regionId) => {
  if (typeof regionId !== "string" || !regionId.trim()) {
    return false;
  }

  return getPeerRegions().some((peer) => peer.regionId === regionId);
};