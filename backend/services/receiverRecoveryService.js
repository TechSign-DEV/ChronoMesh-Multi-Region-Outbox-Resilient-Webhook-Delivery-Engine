
import ProcessedWebhook from "../models/ProcessedWebhook.js";

const STALE_AFTER_MS = 120000;
const BATCH_LIMIT = 500;

export const recoverStaleReceiverRecords = async () => {
  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);

  const staleRecords = await ProcessedWebhook.find({
    status: "PROCESSING",
    updatedAt: { $lt: staleBefore },
  })
    .select("_id")
    .limit(BATCH_LIMIT)
    .lean();

  if (!staleRecords.length) {
    return { recovered: 0 };
  }

  const result = await ProcessedWebhook.deleteMany({
    _id: { $in: staleRecords.map((item) => item._id) },
    status: "PROCESSING",
    updatedAt: { $lt: staleBefore },
  });

  return {
    recovered: result.deletedCount || 0,
  };
};
