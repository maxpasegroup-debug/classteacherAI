import { z } from "zod";

const emailSchema = z.string().trim().email().max(255).transform((email) => email.toLowerCase());

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: z.string().min(8).max(72),
  role: z.enum(["TEACHER", "STUDENT"]),
});

/** Student-only signup: password min 6 per product auth spec. */
export const signupStudentSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters.").max(72),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(72),
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
  newPassword: z.string().min(6, "Password must be at least 6 characters.").max(72),
});
