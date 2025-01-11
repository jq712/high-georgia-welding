import express from "express";
import { Router } from "express";
import {
  authenticateSession,
  restrictTo,
} from "../middleware/authMiddleware.js";
import { getAllowedEmailsPage } from "../controllers/allowedEmailController.js";
import { renderGallery } from "../controllers/imageController.js";
import { getGalleryManagement } from "../controllers/dashboardController.js";

const router = Router();

// Public pages
router.get("/", (req, res) => res.render("index", { currentPage: "home" }));
router.get("/about", (req, res) =>
  res.render("about", { currentPage: "about" })
);
router.get("/contact", (req, res) =>
  res.render("contact", { currentPage: "contact" })
);
router.get("/login", (req, res) =>
  res.render("login", { currentPage: "login" })
);
router.get("/register", (req, res) =>
  res.render("register", { currentPage: "register" })
);
router.get("/gallery", renderGallery);
router.get("/certifications", (req, res) =>
  res.render("certifications", { currentPage: "certifications" })
);

// Protected pages
router.use(authenticateSession);
router.get("/dashboard", (req, res) =>
  res.render("dashboard", { currentPage: "dashboard" })
);

// Admin pages
router.get("/allowed-emails", restrictTo("admin"), getAllowedEmailsPage);
router.get("/gallery-management", getGalleryManagement);

export default router;
