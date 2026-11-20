import { z } from "zod";

export const folderFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Folder name is required")
    .max(100, "Folder name must be 100 characters or less")
    .refine((val) => !/[/\\:*?"<>|]/.test(val), {
      message: 'Folder name cannot contain special characters (/ \\ : * ? " < > |)',
    }),
});

export type FolderFormValues = z.infer<typeof folderFormSchema>;
