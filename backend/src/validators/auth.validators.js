import { z } from "zod";

const roleSchema = z.enum(["student", "college", "dao", "admin"]);

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(2).max(60),
    password: z.string().min(8).max(120),
    role: roleSchema.default("student"),
    walletAddress: z.string().trim().min(4).max(120),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    walletAddress: z.string().trim().min(4).optional().or(z.literal("")),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const walletLoginSchema = z.object({
  body: z.object({
    walletAddress: z.string().trim().min(4),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().trim().min(20),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(12),
    newPassword: z.string().min(8).max(120),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
