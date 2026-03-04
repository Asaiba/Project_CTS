import { Router } from "express";
import {
  createApplication,
  deleteMyApplication,
  listCollegeApplications,
  listMyApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createApplicationSchema,
  deleteApplicationSchema,
  listCollegeApplicationsSchema,
  listMyApplicationsSchema,
  updateApplicationStatusSchema,
} from "../validators/application.validators.js";

export const applicationRouter = Router();

applicationRouter.post("/", requireAuth, requireRole("student"), validate(createApplicationSchema), createApplication);
applicationRouter.get("/mine", requireAuth, requireRole("student"), validate(listMyApplicationsSchema), listMyApplications);
applicationRouter.delete(
  "/:id",
  requireAuth,
  requireRole("student"),
  validate(deleteApplicationSchema),
  deleteMyApplication,
);
applicationRouter.get(
  "/college",
  requireAuth,
  requireRole("college"),
  validate(listCollegeApplicationsSchema),
  listCollegeApplications,
);
applicationRouter.patch(
  "/:id/status",
  requireAuth,
  requireRole("college"),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);
