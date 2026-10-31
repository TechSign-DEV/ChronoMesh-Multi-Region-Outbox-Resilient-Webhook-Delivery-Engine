
import { createHmac, timingSafeEqual } from "node:crypto";

export const signPayload = (payload, secret) => {
  if (typeof secret !== "string" || !secret) {
    throw new Error("A valid signing secret is required");
  }

  return createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
};

export const verifyPayloadSignature = (
  payload,
  secret,
  suppliedSignature
) => {
  if (
    typeof suppliedSignature !== "string" ||
    !/^sha256=[a-f0-9]{64}$/i.test(suppliedSignature)
  ) {
    return false;
  }

  const expected = Buffer.from(
    signPayload(payload, secret),
    "hex"
  );

  const supplied = Buffer.from(
    suppliedSignature.slice(7),
    "hex"
  );

  return (
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)
  );
};
