import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
});

export const updateUserSchema = z
  .object({
    username: z.string().min(3).max(50).optional(),
    password: z.string().min(8).optional(),
    role: z.enum(['admin', 'user']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
