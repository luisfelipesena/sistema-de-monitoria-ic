import { userRoleEnum } from '@sistema-de-monitoria-ic/backend/app/database/schema';
import { z } from 'zod';
export const signUpFormSchema = z
  .object({
    email: z.string().email('Email inválido').toLowerCase(),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
    role: z.enum(userRoleEnum.enumValues).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

export const signInFormSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;
