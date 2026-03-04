import { z } from "zod";

const statusSchema = z.enum(["pending", "approved", "rejected"]);

export const createApplicationSchema = z.object({
  body: z.object({
    collegeId: z.string().uuid(),
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(10).max(2000),
    message: z.string().trim().min(3).max(500).optional(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listMyApplicationsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const listCollegeApplicationsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    status: statusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  params: z.object({}).optional(),
});

export const updateApplicationStatusSchema = z.object({
  body: z.object({
    status: statusSchema,
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const deleteApplicationSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().uuid(),
  }),
});
