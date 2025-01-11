import logger from "../utils/logger.js";

const logUserLogin = (req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.session.userId) {
    logger.info(`User logged in: ${req.session.userId}`);
  }
  next();
};

export default logUserLogin;
