
import { timingSafeEqual } from "node:crypto";

export const verifyRegionToken = (req, res, next) => {
  const configuredToken = process.env.REGION_SHARED_TOKEN;
  const suppliedToken = req.get("X-ChronoMesh-Region-Token");

  if (!configuredToken || !suppliedToken) {
    return res.status(401).json({
      success: false,
      message: "Region authentication is required",
    });
  }

  const expected = Buffer.from(configuredToken);
  const supplied = Buffer.from(suppliedToken);

  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return res.status(403).json({
      success: false,
      message: "Invalid region authentication token",
    });
  }

  next();
};
