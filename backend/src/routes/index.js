import { Router } from "express";
import { adminRouter } from "./admin.routes.js";
import { applicationRouter } from "./application.routes.js";
import { authRouter } from "./auth.routes.js";
import { proposalRouter } from "./proposal.routes.js";
import { uploadRouter } from "./upload.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) =>
  res.json({
    name: "CTS Backend API",
    status: "ok",
    routes: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      admin: "/api/admin",
      applications: "/api/applications",
      proposals: "/api/proposals",
      uploads: "/api/uploads",
    },
  }),
);
apiRouter.get("/health", (_req, res) => res.json({ status: "ok" }));
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/applications", applicationRouter);
apiRouter.use("/proposals", proposalRouter);
apiRouter.use("/uploads", uploadRouter);
