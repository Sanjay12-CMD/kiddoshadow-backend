import { z } from "zod";

/* parent children list */
export const parentChildrenQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

/* daily dashboard (no params needed) */
export const parentDashboardSchema = z.object({});
