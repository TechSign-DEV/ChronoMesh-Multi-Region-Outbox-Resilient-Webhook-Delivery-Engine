
const WINDOW_MS = 60000;
const MAX_REQUESTS = 30;

const clients = new Map();

export const webhookRateLimit = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";

  let record = clients.get(key);

  if (!record || now - record.startedAt >= WINDOW_MS) {
    record = {
      startedAt: now,
      count: 0,
    };
  }

  record.count += 1;
  clients.set(key, record);

  // Opportunistic cleanup of expired entries.
  if (clients.size > 5000) {
    for (const [clientKey, value] of clients) {
      if (now - value.startedAt >= WINDOW_MS) {
        clients.delete(clientKey);
      }
    }
  }

  res.setHeader("RateLimit-Limit", MAX_REQUESTS);
  res.setHeader(
    "RateLimit-Remaining",
    Math.max(0, MAX_REQUESTS - record.count)
  );

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: "Too many webhook management requests",
    });
  }

  next();
};
