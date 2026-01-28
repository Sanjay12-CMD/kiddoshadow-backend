import { z } from "zod";

export const listAuditLogsSchema = z.object({
  query: z.object({
    entity_type: z.enum(["student"]).optional(),
    entity_id: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    limit: z.string().optional(),
    offset: z.string().optional(),
  }),
});
