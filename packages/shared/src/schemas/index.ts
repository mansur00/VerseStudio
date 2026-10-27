import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmNewPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

export const twoFactorSetupSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Authentication code must be 6 digits'),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Please type DELETE to confirm' }),
  }),
});

export const appSettingsSchema = z.object({
  language: z.enum(['en', 'bn']),
  theme: z.enum(['dark', 'light']),
  reduceMotion: z.boolean(),
  resolution: z.enum(['4k', '1440p', '1080p']),
  fps: z.union([z.literal(30), z.literal(60)]),
  videoFormat: z.enum(['webm', 'mp4']),
  enableAutoSaveDrive: z.boolean(),
  shortcuts: z.record(z.string()),
});
