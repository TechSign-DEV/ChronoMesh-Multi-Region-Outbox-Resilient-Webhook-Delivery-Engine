
export const errorHandler = (error, req, res, next) => {
  console.error("API error:", {
    requestId: req.requestId,
    message: error.message,
  });

  if (res.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : error.message,
    requestId: req.requestId || null,
  });
};
