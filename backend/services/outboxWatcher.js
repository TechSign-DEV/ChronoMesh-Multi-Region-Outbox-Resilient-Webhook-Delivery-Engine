
import OutboxEvent from "../models/OutboxEvent.js";
import { webhookQueue } from "../queues/webhookQueue.js";
import regionConfig from "../config/region.js";

let changeStream = null;
let restartTimer = null;
let stopped = false;
let starting = false;

const enqueueEvent = async (event) => {
  if (!event?.eventId || event.regionId !== regionConfig.id) {
    return;
  }

  await webhookQueue.add(
    "deliver-webhook",
    {
      eventId: event.eventId,
      regionId: regionConfig.id,
    },
    {
      jobId: event.eventId,
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: 1000,
      removeOnFail: false,
    }
  );
};

const scheduleRestart = () => {
  if (stopped || restartTimer) return;

  restartTimer = setTimeout(async () => {
    restartTimer = null;
    await startOutboxWatcher();
  }, 5000);
};

export const startOutboxWatcher = async () => {
  if (stopped || starting || changeStream) return;

  starting = true;

  try {
    changeStream = OutboxEvent.watch(
      [{ $match: { operationType: "insert" } }],
      { fullDocument: "default" }
    );

    changeStream.on("change", async (change) => {
      try {
        await enqueueEvent(change.fullDocument);
      } catch (error) {
        console.error("Outbox watcher enqueue error:", error.message);
      }
    });

    changeStream.on("error", async (error) => {
      console.error("Outbox Change Stream error:", error.message);

      const failedStream = changeStream;
      changeStream = null;

      await failedStream?.close().catch(() => {});
      scheduleRestart();
    });

    changeStream.on("close", () => {
      if (changeStream) changeStream = null;
      scheduleRestart();
    });

    console.log(`Outbox watcher started for region ${regionConfig.id}`);
  } catch (error) {
    console.error("Could not start Outbox watcher:", error.message);
    changeStream = null;
    scheduleRestart();
  } finally {
    starting = false;
  }
};

export const stopOutboxWatcher = async () => {
  stopped = true;

  if (restartTimer) {
    clearTimeout(restartTimer);
    restartTimer = null;
  }

  if (changeStream) {
    await changeStream.close().catch(() => {});
    changeStream = null;
  }
};
