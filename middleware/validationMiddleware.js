import Joi from "joi";
import { AppError } from "./errorHandlingMiddleware.js";

// Unified Validation Middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      // Collect all error messages
      const errorMessages = error.details
        .map((detail) => detail.message)
        .join(", ");
      // Throw an AppError with all validation messages
      return next(new AppError(errorMessages, 400));
    }

    // Proceed to the next middleware if validation passes
    next();
  };
};

// Define Reusable Joi Schemas
const emailSchema = Joi.string().email().required().messages({
  "string.email": "Please enter a valid email address.",
  "string.empty": "Email is required.",
  "any.required": "Email is required.",
});

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/, "uppercase letter") // Require at least one uppercase letter
  .pattern(/\d/, "number") // Require at least one number
  .pattern(/[@$!%*?&]/, "special character") // Require at least one special character
  .required()
  .messages({
    "string.pattern.name": "Password must include at least one {#name}.",
    "string.min": "Password must be at least 8 characters long.",
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  });

const baseSchemas = {
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required"
    }),
    
  phone: Joi.string()
    .pattern(/^(\+\d{1,2}\s?)?1?\-?\.?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "Please enter a valid phone number",
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required"
    }),
    
  message: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      "string.empty": "Message is required",
      "string.min": "Message must be at least 10 characters",
      "string.max": "Message cannot exceed 1000 characters",
      "any.required": "Message is required"
    })
};

const schemas = {
  register: Joi.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords must match.",
        "any.required": "Please confirm your password.",
      }),
  }),

  login: Joi.object({
    email: emailSchema,
    password: Joi.string().required().messages({
      "string.empty": "Password is required.",
      "any.required": "Password is required.",
    }),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.empty": "Current password is required.",
      "any.required": "Current password is required.",
    }),
    newPassword: passwordSchema,
    confirmNewPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "New passwords must match.",
        "any.required": "Please confirm your new password.",
      }),
  }),

  contactForm: Joi.object({
    name: baseSchemas.name,
    email: emailSchema,
    phone: baseSchemas.phone,
    message: baseSchemas.message
  }).options({ stripUnknown: true })
};

// Email Sanitization Middleware
const sanitizeEmailMiddleware = (req, res, next) => {
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }
  next();
};

export { validate, schemas, sanitizeEmailMiddleware };
