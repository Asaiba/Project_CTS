import { z } from "zod";

export const updateMeSchema = z.object({
  body: z.object({
    username: z.string().min(2).max(60).optional(),
    walletAddress: z.string().trim().min(4).max(120).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listUsersSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().optional(),
  }),
  params: z.object({}).optional(),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(["student", "donor", "college", "dao", "admin"]),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});
