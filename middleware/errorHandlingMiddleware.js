import logger from "../utils/logger.js";

// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    // Capture the stack trace for better debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

// Utility to determine if the request expects a JSON response
const isApiRequest = (req) => {
  return (
    req.path.startsWith("/api/") ||
    req.headers["content-type"] === "application/json"
  );
};

// Centralized error-handling middleware
const errorHandler = (err, req, res, next) => {
  // Set default status code and status
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log the error
  if (err.isOperational) {
    // Log operational errors (user errors, validation errors, etc.)
    logger.warn(`Operational error: ${err.message}`);
  } else {
    // Log unexpected or programming errors
    logger.error(`Unexpected error: ${err.message}`, { stack: err.stack });
  }

  // Respond with JSON
  res.status(err.statusCode).json({
    status: err.status,
    message: err.isOperational
      ? err.message // For operational errors, send a specific message
      : "Something went wrong! Please try again later.", // For unknown errors, send a generic message
  });
};

// Wrapper to handle asynchronous route handlers and pass errors to the middleware
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { AppError, isApiRequest, errorHandler, catchAsync };
