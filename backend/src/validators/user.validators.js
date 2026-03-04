import { z } from "zod";
const roleSchema = z.enum(["student", "college", "dao", "admin"]);
const logoSchema = z
  .string()
  .trim()
  .refine((value) => /^https?:\/\/.+/i.test(value) || /^\/uploads\/.+/i.test(value), {
    message: "Invalid logo URL",
  });

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
    role: roleSchema.optional(),
    isActive: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
  }),
  params: z.object({}).optional(),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: roleSchema,
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createAdminUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().trim().min(2).max(60),
    role: roleSchema.default("student"),
    walletAddress: z.string().trim().min(4).max(120).optional().nullable(),
    logoUrl: logoSchema.optional().nullable(),
    password: z.string().min(8).max(120).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const updateUserSchema = z.object({
  body: z
    .object({
      role: roleSchema.optional(),
      email: z.string().email().optional(),
      username: z.string().trim().min(2).max(60).optional(),
      walletAddress: z.string().trim().min(4).max(120).optional().nullable(),
      logoUrl: logoSchema.optional().nullable(),
      isActive: z.boolean().optional(),
    })
    .refine((payload) => Object.keys(payload).length > 0, {
      message: "At least one updatable field is required",
    }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deactivateUserSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});
