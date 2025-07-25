import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { ValidationError } from "./errorHandler.js";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError("Validation failed", errors.array());
  }
  next();
};

// Document validation rules
export const validateDocumentUpload = [
  body("projectId")
    .optional()
    .isString()
    .withMessage("Project ID must be a string"),
  body("analysisType")
    .optional()
    .isIn(["requirements", "estimation", "summary", "full"])
    .withMessage(
      "Analysis type must be one of: requirements, estimation, summary, full"
    ),
  handleValidationErrors,
];

export const validateDocumentId = [
  param("id").isString().notEmpty().withMessage("Document ID is required"),
  handleValidationErrors,
];

// Estimation validation rules
export const validateEstimationRequest = [
  body("requirements").isArray().withMessage("Requirements must be an array"),
  body("requirements.*.description")
    .isString()
    .notEmpty()
    .withMessage("Each requirement must have a description"),
  body("requirements.*.type")
    .isIn(["functional", "non-functional"])
    .withMessage("Requirement type must be functional or non-functional"),
  body("requirements.*.priority")
    .isIn(["high", "medium", "low"])
    .withMessage("Priority must be high, medium, or low"),
  body("hourlyRate")
    .optional()
    .isNumeric()
    .withMessage("Hourly rate must be a number"),
  body("complexityMultiplier")
    .optional()
    .isNumeric()
    .withMessage("Complexity multiplier must be a number"),
  handleValidationErrors,
];

// Workflow validation rules
export const validateWorkflowCreation = [
  body("name").isString().notEmpty().withMessage("Workflow name is required"),
  body("definition")
    .isObject()
    .withMessage("Workflow definition must be an object"),
  body("definition.steps")
    .isArray()
    .withMessage("Workflow steps must be an array"),
  body("schedule")
    .optional()
    .isString()
    .withMessage("Schedule must be a cron string"),
  handleValidationErrors,
];

export const validateWorkflowId = [
  param("id").isString().notEmpty().withMessage("Workflow ID is required"),
  handleValidationErrors,
];

// Auth validation rules
export const validateLogin = [
  body("username").isString().notEmpty().withMessage("Username is required"),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handleValidationErrors,
];

export const validateRegistration = [
  body("username")
    .isString()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["admin", "user"])
    .withMessage("Role must be admin or user"),
  handleValidationErrors,
];

// Query validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];
