import { z } from "zod";

function pickOrThrow<T extends z.ZodTypeAny>(schema: T, values: unknown) {
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables: ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}`);
  }
  return parsed.data;
}

export function getCoreEnv() {
  return pickOrThrow(
    z.object({
      NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
      DATABASE_URL: z.string().min(1),
      JWT_SECRET: z.string().min(24),
    }),
    process.env,
  );
}

export function getOpenAiEnv() {
  return pickOrThrow(
    z.object({
      OPENAI_API_KEY: z.string().min(1),
      OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    }),
    process.env,
  );
}

export function getBrevoEnv() {
  return pickOrThrow(
    z.object({
      BREVO_API_KEY: z.string().min(1),
      BREVO_SENDER_EMAIL: z.string().email(),
      BREVO_SENDER_NAME: z.string().default("ClassteacherAI"),
    }),
    process.env,
  );
}

export function getRazorpayEnv() {
  return pickOrThrow(
    z.object({
      RAZORPAY_KEY_ID: z.string().min(1),
      RAZORPAY_KEY_SECRET: z.string().min(1),
      RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
    }),
    process.env,
  );
}
