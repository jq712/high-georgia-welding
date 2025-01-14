import { AppError } from "./errorHandlingMiddleware.js";

const authenticateSession = (req, res, next) => {
  if (!req.session || !req.session.user) {
    logger.warn("Authentication failed: No session found");
    return res.status(401).json({
      status: "error",
      message: "Not authenticated",
    });
  }

  res.locals.user = req.session.user;
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized",
      });
    }
    next();
  };
};

export { authenticateSession, restrictTo };
