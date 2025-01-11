import express, { Router } from "express";
const router = Router();
import * as imageController from "../controllers/imageController.js";
import {
  authenticateSession,
  restrictTo,
} from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

// Protected routes
router.use(authenticateSession);
router.use(restrictTo("admin"));

router.post("/", upload.single("image"), imageController.createImage);
router
  .route("/:id")
  .patch(imageController.updateImage)
  .delete(imageController.deleteImage);

export default router;
