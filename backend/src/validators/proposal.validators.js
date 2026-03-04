import { z } from "zod";

export const createProposalSchema = z.object({
  body: z.object({
    title: z.string().trim().min(4).max(160),
    description: z.string().trim().min(10).max(2000),
    durationMinutes: z.coerce.number().int().min(1).max(24 * 60 * 30),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listProposalsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    mine: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    active: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
  params: z.object({}).optional(),
});

export const voteProposalSchema = z.object({
  body: z.object({
    choice: z.enum(["yes", "no"]),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});
