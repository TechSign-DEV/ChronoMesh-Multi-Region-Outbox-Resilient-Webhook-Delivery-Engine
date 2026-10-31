
const regionId = process.env.REGION_ID || "local-region";
const regionName = process.env.REGION_NAME || "Local Development";

if (!/^[a-zA-Z0-9_-]{2,80}$/.test(regionId)) {
  throw new Error("REGION_ID must contain 2-80 letters, numbers, underscores or hyphens");
}

const regionConfig = Object.freeze({
  id: regionId,
  name: regionName,
  environment: process.env.NODE_ENV || "development",
  isPrimary: process.env.REGION_PRIMARY === "true",
  publicBaseUrl:
    process.env.PUBLIC_BASE_URL || "http://localhost:5000",
});

export default regionConfig;
