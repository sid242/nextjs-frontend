import { z } from "zod";

export const createChannelSchema = z.object({
  type: z.enum(["PUBLIC", "PRIVATE", "GROUP"]).default("PUBLIC"),
  name: z.string().trim().min(1, "Channel name is required").max(120, "Maximum 120 characters"),
  topic: z.string().trim().max(255).optional(),
  description: z.string().trim().max(1000).optional(),
  memberIds: z.array(z.string().uuid()).default([]),
});

export type CreateChannelValues = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = z.object({
  name: z.string().trim().min(1, "Channel name is required").max(120),
  topic: z.string().trim().max(255).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export type UpdateChannelValues = z.infer<typeof updateChannelSchema>;

export const sendMessageSchema = z
  .object({
    body: z.string().max(4000),
    attachmentsCount: z.number().int().min(0).default(0),
  })
  .refine((data) => data.body.trim().length > 0 || data.attachmentsCount > 0, {
    message: "Enter a message or attach a file",
  });

export const editMessageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(4000),
});
