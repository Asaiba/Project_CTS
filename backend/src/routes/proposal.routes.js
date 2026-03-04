import { Router } from "express";
import { createProposal, listProposals, voteProposal } from "../controllers/proposal.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/rbac.js";
import { validate } from "../middleware/validate.js";
import { createProposalSchema, listProposalsSchema, voteProposalSchema } from "../validators/proposal.validators.js";

export const proposalRouter = Router();

proposalRouter.get("/", requireAuth, validate(listProposalsSchema), listProposals);
proposalRouter.post("/", requireAuth, requireRole("college"), validate(createProposalSchema), createProposal);
proposalRouter.post("/:id/vote", requireAuth, requireRole("dao", "admin"), validate(voteProposalSchema), voteProposal);
