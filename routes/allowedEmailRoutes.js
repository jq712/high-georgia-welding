import express from "express";
import {
  authenticateSession,
  restrictTo,
} from "../middleware/authMiddleware.js";
import {
  getAllowedEmails,
  addAllowedEmail,
  updateAllowedEmail,
  deleteAllowedEmail,
} from "../controllers/allowedEmailController.js";

const router = express.Router();

router
  .route("/")
  .get(authenticateSession, restrictTo("admin"), getAllowedEmails)
  .post(authenticateSession, restrictTo("admin"), addAllowedEmail);

router
  .route("/:id")
  .patch(authenticateSession, restrictTo("admin"), updateAllowedEmail)
  .delete(authenticateSession, restrictTo("admin"), deleteAllowedEmail);

export default router;
