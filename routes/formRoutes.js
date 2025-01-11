import express, { Router } from "express";
const router = Router();

import * as formController from "../controllers/formController.js";
import {
  authenticateSession,
  restrictTo,
} from "../middleware/authMiddleware.js";
import { validate, schemas } from "../middleware/validationMiddleware.js";

// Public routes (no authentication required)
router.post(
  "/submit",
  validate(schemas.contactForm),
  formController.submitForm
);

// Protected routes (require authentication)
router.use(authenticateSession);

// Form management routes
router
  .route("/")
  .get(formController.getForms)
  .delete(restrictTo("admin"), formController.deleteAllForms);

router.delete("/:id", restrictTo("admin"), formController.deleteForm);

export default router;
