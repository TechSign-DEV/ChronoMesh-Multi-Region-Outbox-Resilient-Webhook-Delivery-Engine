
import { randomUUID } from "node:crypto";
import OutboxEvent from "../models/OutboxEvent.js";

const DEFAULT_LEASE_MS = 60000;

export const claimEventLease = async (
  eventId,
  regionId,
  leaseDurationMs = DEFAULT_LEASE_MS
) => {
  const now = new Date();
  const leaseOwner = `${regionId}:${randomUUID()}`;

  const event = await OutboxEvent.findOneAndUpdate(
    {
      eventId,
      regionId,
      status: { $in: ["PENDING", "PROCESSING"] },
      $or: [
        { leaseExpiresAt: null },
        { leaseExpiresAt: { $lte: now } },
        { leaseExpiresAt: { $exists: false } },
      ],
    },
    {
      $set: {
        status: "PROCESSING",
        leaseOwner,
        leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  return event ? { event, leaseOwner } : null;
};

export const renewEventLease = async (
  eventId,
  leaseOwner,
  leaseDurationMs = DEFAULT_LEASE_MS
) => {
  const now = new Date();

  return OutboxEvent.findOneAndUpdate(
    {
      eventId,
      leaseOwner,
      status: "PROCESSING",
      leaseExpiresAt: { $gt: now },
    },
    {
      $set: {
        leaseExpiresAt: new Date(now.getTime() + leaseDurationMs),
      },
    },
    { new: true }
  );
};

export const releaseEventLease = async (
  eventId,
  leaseOwner,
  nextStatus = "PENDING"
) => {
  if (!["PENDING", "DELIVERED", "FAILED"].includes(nextStatus)) {
    throw new Error("Invalid lease release status");
  }

  return OutboxEvent.findOneAndUpdate(
    {
      eventId,
      leaseOwner,
    },
    {
      $set: {
        status: nextStatus,
        leaseOwner: null,
        leaseExpiresAt: null,
      },
    },
    { new: true }
  );
};
