
import {
  recoverStaleReceiverRecords,
} from "./receiverRecoveryService.js";

let timer = null;
let running = false;

export const startReceiverRecovery = async () => {
  if (timer) return;

  const execute = async () => {
    if (running) return;

    running = true;

    try {
      const result = await recoverStaleReceiverRecords();

      if (result.recovered) {
        console.log(
          "Recovered abandoned receiver records:",
          result.recovered
        );
      }
    } catch (error) {
      console.error("Receiver recovery error:", error.message);
    } finally {
      running = false;
    }
  };

  await execute();

  timer = setInterval(execute, 30000);

  console.log("Receiver recovery scheduler started");
};

export const stopReceiverRecovery = async () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};
