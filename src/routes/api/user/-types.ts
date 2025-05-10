import { userRoleEnum, userTable } from '@/server/database/schema';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Schema for user data returned by the API
export const apiUserSchema = createSelectSchema(userTable, {
  // You might want to exclude sensitive fields or add related data here
  // For now, let's include basic fields and role.
  email: z.string().email(),
  role: z.enum(userRoleEnum.enumValues),
}).pick({
  id: true,
  username: true,
  email: true,
  role: true,
});

export type ApiUser = z.infer<typeof apiUserSchema>;

// Schema for updating a user's role
export const updateUserRoleSchema = z.object({
  role: z.enum(userRoleEnum.enumValues, {
    required_error: 'O papel (role) é obrigatório.',
  }),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

// Response type for listing users
export type UserListResponse = ApiUser[]; 