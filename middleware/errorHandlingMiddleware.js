import logger from "../utils/logger.js";
// Custom error class for operational errors
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = this.getErrorStatus(statusCode);
    this.isOperational = true;
  }

  getErrorStatus(code) {
    return `${code}`.startsWith("4") ? "fail" : "error";
  }
}

// Determine if request expects JSON response
const isApiRequest = (req) => {
  logger.info("Headers:", req.headers); // Example of logging info
  return req.xhr || req.headers.accept.includes("json");
};

// Handle web redirects based on error type
const handleWebRedirect = (err, req, res) => {
  logger.warn(`Redirecting user due to error: ${err.message}`); // Log warning
  req.session.messages = { error: err.message };

  if (err.statusCode === 401) {
    return res.redirect("/login");
  }
  if (err.statusCode === 404) {
    return res.redirect("/404");
  }

  return res.redirect("back");
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  // Set default error status and code
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log the error
  if (err.isOperational) {
    logger.error(
      `Operational error: ${err.message} (status: ${err.statusCode})`
    );
  } else {
    logger.error(`Unexpected error: ${err.stack || err.message}`);
  }

  // Handle common MongoDB errors
  if (err.code === 11000) {
    err.statusCode = 400;
    err.message = "Duplicate field value entered";
    logger.warn(`Duplicate key error: ${err.message}`);
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    err.statusCode = 400;
    err.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(". ");
    logger.warn(`Validation error: ${err.message}`);
  }

  // Send appropriate response based on request type
  if (isApiRequest(req)) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  return handleWebRedirect(err, req, res);
};

// Wrapper for async route handlers
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { AppError, errorHandler, catchAsync };
