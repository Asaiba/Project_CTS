import { Router } from "express";
import { getMe, listColleges, listDaoMembers, updateMe } from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { updateMeSchema } from "../validators/user.validators.js";

export const userRouter = Router();

userRouter.get("/me", requireAuth, getMe);
userRouter.get("/colleges", requireAuth, listColleges);
userRouter.get("/dao-members", requireAuth, listDaoMembers);
userRouter.patch("/me", requireAuth, validate(updateMeSchema), updateMe);
