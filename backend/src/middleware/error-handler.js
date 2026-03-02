export const errorHandler = (error, _req, res, _next) => {
  const status = error.statusCode || 500;
  const message = error.message || "Internal server error";
  return res.status(status).json({
    error: status >= 500 ? "internal_error" : "request_error",
    message,
  });
};
