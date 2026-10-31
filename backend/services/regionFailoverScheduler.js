
import { runRegionFailover } from "./regionFailoverService.js";

let timer = null;
let running = false;

const INTERVAL_MS = 30000;

const executeFailover = async () => {
  if (running) return;

  running = true;

  try {
    const result = await runRegionFailover();

    if (result?.reassigned > 0) {
      console.log(
        `Regional failover reassigned ${result.reassigned} events`
      );
    }
  } catch (error) {
    console.error("Regional failover error:", error.message);
  } finally {
    running = false;
  }
};

export const startRegionFailoverScheduler = async () => {
  if (timer) return;

  await executeFailover();

  timer = setInterval(executeFailover, INTERVAL_MS);

  console.log("Regional failover scheduler started");
};

export const stopRegionFailoverScheduler = async () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
