import { z } from "zod";

const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(72),
  role: z.enum(["TEACHER", "STUDENT"]),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(72),
});

export const forgotPasswordEmailSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().trim().regex(/^\d{6}$/),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(20),
  newPassword: z.string().min(8).max(72),
});
