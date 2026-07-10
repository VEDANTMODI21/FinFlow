import { VercelRequest, VercelResponse } from "@vercel/node";

const otps = new Map<string, { otp: string; expiresAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({
      success: false,
      error: "Please enter a valid email address."
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otps.set(normalizedEmail, { otp, expiresAt });

  // Send via Resend if API key configured
  if (process.env.RESEND_API_KEY) {
    try {
      const senderEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
      const senderName = process.env.SENDER_NAME || "FinFlow";

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0A0A; color: #FFFFFF; padding: 40px 20px; text-align: center; border-radius: 8px;">
          <div style="max-width: 480px; margin: 0 auto; background-color: #141414; border: 1px solid #333333; padding: 32px; text-align: left; border-radius: 4px;">
            <div style="font-size: 11px; font-family: monospace; color: #3b82f6; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; font-weight: 600;">
              FinFlow Secure Authentication
            </div>
            <h2 style="font-size: 20px; font-weight: 300; margin: 0 0 16px 0; letter-spacing: -0.5px; color: #FFFFFF;">Verification Required</h2>
            <p style="font-size: 14px; color: #CCCCCC; line-height: 1.5; margin: 0 0 24px 0;">
              Welcome to FinFlow Personal Budget Manager. Use the authorization code below to verify your email:
            </p>
            <div style="background-color: #000000; border: 1px solid #222222; padding: 20px; text-align: center; margin-bottom: 24px; border-radius: 6px;">
              <span style="font-family: monospace; font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #3b82f6;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #888888; margin: 0; line-height: 1.4;">
              This code is valid for <strong>5 minutes</strong>. If you didn't request this, please ignore.
            </p>
          </div>
        </div>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [normalizedEmail],
          subject: `${otp} is your verification code`,
          html: emailHtml,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Resend error:", err);
        throw new Error("Failed to send email");
      }

      return res.status(200).json({
        success: true,
        message: "OTP sent to your email. Check your inbox."
      });
    } catch (error: any) {
      console.error("Send OTP error:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP. Please try again."
      });
    }
  } else {
    return res.status(500).json({
      success: false,
      error: "Email service not configured."
    });
  }
}
