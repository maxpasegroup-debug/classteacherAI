import { getBrevoEnv } from "@/lib/env";

type SendOtpEmailInput = {
  toEmail: string;
  toName: string;
  otpCode: string;
};

export async function sendOtpEmail({ toEmail, toName, otpCode }: SendOtpEmailInput) {
  const { BREVO_API_KEY: apiKey, BREVO_SENDER_EMAIL: senderEmail, BREVO_SENDER_NAME: senderName } = getBrevoEnv();

  if (!apiKey || !senderEmail) {
    throw new Error("Brevo email environment variables are missing.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email: toEmail, name: toName }],
      subject: "ClassteacherAI Password Reset OTP",
      htmlContent: `
        <div style="font-family: Inter, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
          <h2 style="margin-bottom: 8px;">Reset your password</h2>
          <p style="margin-top: 0; color: #475569;">Use the OTP below to continue your password reset:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 20px 0; color: #0f172a;">
            ${otpCode}
          </div>
          <p style="color: #475569;">This code expires in 10 minutes.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo send failed: ${details}`);
  }
}
