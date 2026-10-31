import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redis = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

try {
  const result = await redis.ping();
  console.log("Memurai connection successful:", result);
} catch (error) {
  console.error("Memurai connection failed:", error.message);
} finally {
  await redis.quit();
}