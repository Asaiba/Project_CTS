import { Router } from "express";
import { listUsers, updateUserRole } from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { listUsersSchema, updateRoleSchema } from "../validators/user.validators.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.get("/users", validate(listUsersSchema), listUsers);
adminRouter.patch("/users/:id/role", validate(updateRoleSchema), updateUserRole);
