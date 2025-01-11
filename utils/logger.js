import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Create logger
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    colorize(), // Adds color for easier reading in development
    logFormat
  ),
  transports: [
    new transports.Console(), // Logs to Railway dashboard in production
  ],
});

// In test mode, suppress logs
if (process.env.NODE_ENV === "test") {
  logger.silent = true;
}

export default logger;
