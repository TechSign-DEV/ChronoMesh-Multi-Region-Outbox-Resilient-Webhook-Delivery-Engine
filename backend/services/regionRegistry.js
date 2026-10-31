
const parsePeerRegions = () => {
  const raw = process.env.REGION_PEERS || "";

  if (!raw.trim()) return [];

  return raw.split(",").map((entry) => {
    const separator = entry.indexOf("=");

    if (separator <= 0) {
      throw new Error(`Invalid REGION_PEERS entry: ${entry}`);
    }

    const regionId = entry.slice(0, separator).trim();
    const baseUrl = entry.slice(separator + 1).trim();

    if (!/^[a-zA-Z0-9_-]{2,80}$/.test(regionId)) {
      throw new Error(`Invalid peer region ID: ${regionId}`);
    }

    let parsed;

    try {
      parsed = new URL(baseUrl);
    } catch {
      throw new Error(`Invalid peer URL for region ${regionId}`);
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error(`Unsupported peer protocol for region ${regionId}`);
    }

    if (
      process.env.NODE_ENV === "production" &&
      parsed.protocol !== "https:"
    ) {
      throw new Error(`Peer region ${regionId} must use HTTPS in production`);
    }

    if (parsed.username || parsed.password) {
      throw new Error(`Peer URL for ${regionId} cannot contain credentials`);
    }

    return {
      regionId,
      regionName: regionId,
      baseUrl: parsed.origin,
    };
  });
};

const localRegion = Object.freeze({
  regionId: process.env.REGION_ID || "local-region",
  regionName: process.env.REGION_NAME || "Local Development",
  baseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:5000",
});

const peerRegions = parsePeerRegions();

if (peerRegions.some((peer) => peer.regionId === localRegion.regionId)) {
  throw new Error("The local REGION_ID cannot also appear in REGION_PEERS");
}

export const getLocalRegion = () => localRegion;

export const getPeerRegions = () => peerRegions;

export const getRegionById = (regionId) => {
  if (regionId === localRegion.regionId) return localRegion;

  return peerRegions.find((region) => region.regionId === regionId) || null;
};

export const getAllRegions = () => [localRegion, ...peerRegions];

// Backward compatibility
export const getRegions = getAllRegions;
