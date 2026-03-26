import { z } from "zod";

const statusSchema = z.enum(["pending", "approved", "rejected"]);

export const createApplicationSchema = z.object({
  body: z.object({
    collegeId: z.string().uuid(),
    essay: z.string().trim().min(120).max(5000).optional(),
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    message: z.string().trim().min(3).max(5000).optional(),
  }).superRefine((value, ctx) => {
    const hasEssay = Boolean(value.essay);
    const hasLegacyPayload = Boolean(value.title && value.description);
    const hasMessage = Boolean(value.message);

    if (!hasEssay && !hasLegacyPayload && !hasMessage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["essay"],
        message: "Scholarship essay is required.",
      });
    }
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
