import express, { Router } from "express";
const router = Router();

import * as authController from "../controllers/authController.js";
import { validate, schemas } from "../middleware/validationMiddleware.js";

// Public routes
router.post("/register", validate(schemas.register), authController.register);
router.post("/login", validate(schemas.login), authController.login);
router.post("/logout", authController.logout);
router.get("/current-user", authController.getCurrentUser);

export default router;
