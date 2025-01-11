import dotenv from "dotenv";
dotenv.config();
import express from "express";
import helmet from "helmet";
import compression from "compression";
import session from "express-session";
import logger from "./utils/logger.js";
import path from "path";
import { connectDatabase } from "./utils/databaseConnection.js";
import { errorHandler } from "./middleware/errorHandlingMiddleware.js";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import allowedEmailRoutes from "./routes/allowedEmailRoutes.js";
import pageRoutes from "./routes/pageRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

connectDatabase();

app.use((req, res, next) => {
  const ext = path.extname(req.url);
  if (
    ext === ".js" ||
    ext === ".css" ||
    ext === ".jpg" ||
    ext === ".jpeg" ||
    ext === ".png" ||
    ext === ".gif" ||
    ext === ".svg"
  ) {
    express.static(path.join(__dirname, "public"))(req, res, next);
  } else {
    next();
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400000, // 24 hours
  },
};

app.use(session(sessionConfig));

// Make messages available to all views
app.use((req, res, next) => {
  res.locals.messages = req.session.messages || {};
  req.session.messages = {}; // Clear the messages
  next();
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/allowed-emails", allowedEmailRoutes);
app.use("/", pageRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(
    `Server running on port ${PORT}, mongoose is connected to ${mongoose.connection.host}`
  );
});

const gracefulShutdown = async () => {
  console.log("Starting graceful shutdown...");

  try {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    console.log("Server closed");

    await mongoose.connection.close();
    console.log("Database connections closed");

    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
