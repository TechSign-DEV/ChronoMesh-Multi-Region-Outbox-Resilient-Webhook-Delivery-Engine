import http from "node:http";
import https from "node:https";
import { resolveAndValidateWebhookUrl } from "./urlSecurityService.js";

export const createPinnedHttpAgents = async (targetUrl) => {
  const validation = await resolveAndValidateWebhookUrl(targetUrl);

  const allowedAddresses = new Map(
    validation.addresses.map((item) => [item.address, item.family])
  );

  const lookup = (hostname, options, callback) => {
    if (hostname.toLowerCase() !== validation.hostname) {
      return callback(new Error("Unexpected hostname during webhook request"));
    }

    const addresses = [...allowedAddresses.entries()].map(
      ([address, family]) => ({ address, family })
    );

    if (options?.all) {
      return callback(null, addresses);
    }

    const selected = addresses[0];

    if (!selected) {
      return callback(new Error("No validated webhook IP address available"));
    }

    callback(null, selected.address, selected.family);
  };

  const httpAgent = new http.Agent({
    keepAlive: false,
    lookup,
  });

  const httpsAgent = new https.Agent({
    keepAlive: false,
    rejectUnauthorized: true,
    lookup,
  });

  return {
    httpAgent,
    httpsAgent,
    destroy() {
      httpAgent.destroy();
      httpsAgent.destroy();
    },
  };
};