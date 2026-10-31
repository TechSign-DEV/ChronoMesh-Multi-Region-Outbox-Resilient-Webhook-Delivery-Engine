
import { randomUUID } from "node:crypto";

import SystemLock from "../models/SystemLock.js";
import RegionHealth from "../models/RegionHealth.js";
import OutboxEvent from "../models/OutboxEvent.js";

import { getRegions } from "./regionRegistry.js";
import { selectRegionForEvent } from "./regionRoutingService.js";

const LOCK_KEY = "chronomesh-region-failover";
const LOCK_DURATION_MS = 120000;
const HEARTBEAT_TIMEOUT_MS = 60000;
const BATCH_LIMIT = 500;

export const runRegionFailover = async () => {
  const owner = randomUUID();
  const now = new Date();

  let lock;

  try {
    lock = await SystemLock.findOneAndUpdate(
      {
        key: LOCK_KEY,
        $or: [
          { expiresAt: { $lte: now } },
          { owner },
        ],
      },
      {
        $set: {
          owner,
          expiresAt: new Date(now.getTime() + LOCK_DURATION_MS),
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  } catch (error) {
    if (error.code === 11000) {
      return { skipped: true };
    }
    throw error;
  }

  if (!lock || lock.owner !== owner) {
    return { skipped: true };
  }

  try {
    const configuredRegions = getRegions();

    const healthRecords = await RegionHealth.find().lean();

    const healthById = new Map(
      healthRecords.map((item) => [item.regionId, item])
    );

    const cutoff = new Date(Date.now() - HEARTBEAT_TIMEOUT_MS);

    const isHealthy = (region) => {
      const health = healthById.get(region.id);

      return Boolean(
        health &&
        health.status === "HEALTHY" &&
        new Date(health.lastHeartbeat) >= cutoff
      );
    };

    const healthyRegions = configuredRegions.filter(isHealthy);

    const unavailableRegions = configuredRegions.filter(
      (region) => !isHealthy(region)
    );

    if (!healthyRegions.length) {
      return {
        skipped: true,
        reason: "No healthy destination region is available",
      };
    }

    let reassigned = 0;

    for (const failedRegion of unavailableRegions) {
      const events = await OutboxEvent.find({
        regionId: failedRegion.id,
        status: { $in: ["PENDING", "PROCESSING"] },
        $or: [
          { leaseExpiresAt: null },
          { leaseExpiresAt: { $lte: new Date() } },
        ],
      })
        .sort({ createdAt: 1 })
        .limit(BATCH_LIMIT)
        .lean();

      for (const event of events) {
        const target = selectRegionForEvent(
          event.eventId,
          healthyRegions
        );

        if (!target) continue;

        const result = await OutboxEvent.updateOne(
          {
            _id: event._id,
            regionId: failedRegion.id,
            status: { $in: ["PENDING", "PROCESSING"] },
            $or: [
              { leaseExpiresAt: null },
              { leaseExpiresAt: { $lte: new Date() } },
            ],
          },
          {
            $set: {
              regionId: target.id,
              status: "PENDING",
              leaseOwner: null,
              leaseExpiresAt: null,
              lastError: `Reassigned from unavailable region ${failedRegion.id}`,
            },
          }
        );

        reassigned += result.modifiedCount || 0;
      }
    }

    return {
      success: true,
      reassigned,
      unavailableRegions: unavailableRegions.map(
        (region) => region.id
      ),
    };
  } finally {
    await SystemLock.updateOne(
      { key: LOCK_KEY, owner },
      {
        $set: {
          owner: null,
          expiresAt: new Date(0),
        },
      }
    );
  }
};
