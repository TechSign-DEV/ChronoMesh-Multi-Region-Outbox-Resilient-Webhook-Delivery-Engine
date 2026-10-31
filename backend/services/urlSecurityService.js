
import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";

const isPublicAddress = (address) => {
  try {
    const parsed = ipaddr.process(address);
    return parsed.range() === "unicast";
  } catch {
    return false;
  }
};

export const resolveAndValidateWebhookUrl = async (url) => {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid webhook URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Webhook URLs cannot contain credentials");
  }

  if (parsed.hash) {
    throw new Error("Webhook URLs cannot contain fragments");
  }

  const hostname = parsed.hostname.toLowerCase();

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]";

  if (isLocalhost && process.env.NODE_ENV !== "production") {
    return {
      url: parsed,
      hostname,
      addresses: [{ address: hostname.includes(":") ? "::1" : "127.0.0.1", family: hostname.includes(":") ? 6 : 4 }],
      developmentLocalhost: true,
    };
  }

  if (isLocalhost) {
    throw new Error("Localhost webhook URLs are not allowed in production");
  }

  let addresses;

  try {
    addresses = await dns.lookup(hostname, {
      all: true,
      verbatim: true,
    });
  } catch {
    throw new Error("Webhook hostname could not be resolved");
  }

  if (!addresses.length) {
    throw new Error("Webhook hostname has no DNS records");
  }

  for (const record of addresses) {
    if (!isPublicAddress(record.address)) {
      throw new Error("Webhook URL resolves to a private or reserved IP address");
    }
  }

  return {
    url: parsed,
    hostname,
    addresses,
    developmentLocalhost: false,
  };
};

// Backward-compatible export for existing controller imports.
export const validateWebhookUrl = async (url) => {
  await resolveAndValidateWebhookUrl(url);
  return true;
};
