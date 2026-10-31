
import { randomUUID } from "node:crypto";

export const requestId = (req, res, next) => {
  const incoming = req.get("X-Request-Id");

  const validIncoming =
    typeof incoming === "string" &&
    /^[a-zA-Z0-9_-]{1,100}$/.test(incoming);

  req.requestId = validIncoming ? incoming : randomUUID();

  res.setHeader("X-Request-Id", req.requestId);

  next();
};
