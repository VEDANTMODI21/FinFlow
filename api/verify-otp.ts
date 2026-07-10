import { VercelRequest, VercelResponse } from "@vercel/node";

const otps = new Map<string, { otp: string; expiresAt: number }>();
const sessions = new Map<string, { email: string; expiresAt: number }>();

function generateSessionToken(): string {
  return "session_" + Math.random().toString(36).substring(2, 18);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: "Email and OTP are required"
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const stored = otps.get(normalizedEmail);

  if (!stored || Date.now() > stored.expiresAt) {
    otps.delete(normalizedEmail);
    return res.status(400).json({
      success: false,
      error: "OTP expired or not found. Request a new code."
    });
  }

  if (stored.otp !== otp.trim()) {
    return res.status(400).json({
      success: false,
      error: "Invalid OTP code. Please check and try again."
    });
  }

  otps.delete(normalizedEmail);

  const sessionToken = generateSessionToken();
  sessions.set(sessionToken, {
    email: normalizedEmail,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    sessionToken,
    expiresIn: 24 * 60 * 60,
  });
}
