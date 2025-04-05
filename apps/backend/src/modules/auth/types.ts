import { z } from 'zod';
import { userRoleEnum } from '../../database/schema';

// --- Schemas ---
export const signUpSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  // Add password complexity requirements if needed
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  role: z.enum(userRoleEnum.enumValues).optional().default('student'), // Default to student
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z.string().min(1, 'Password cannot be empty'),
});
