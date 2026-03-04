import { Router } from "express";
import { createUser, deactivateUser, listUsers, updateUser, updateUserRole } from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import {
  createAdminUserSchema,
  deactivateUserSchema,
  listUsersSchema,
  updateRoleSchema,
  updateUserSchema,
} from "../validators/user.validators.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.get("/users", validate(listUsersSchema), listUsers);
adminRouter.post("/users", validate(createAdminUserSchema), createUser);
adminRouter.patch("/users/:id", validate(updateUserSchema), updateUser);
adminRouter.patch("/users/:id/role", validate(updateRoleSchema), updateUserRole);
adminRouter.delete("/users/:id", validate(deactivateUserSchema), deactivateUser);
