import { VercelRequest, VercelResponse } from "@vercel/node";

const users = new Map<string, any>();
const sessions = new Map<string, { email: string; expiresAt: number }>();

function generateSessionToken(): string {
  return "session_" + Math.random().toString(36).substring(2, 18);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password || password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Email and password (min 6 chars) are required"
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const userData = {
    email: normalizedEmail,
    password,
    transactions: [],
    budgets: [],
    savingsGoals: [],
    createdAt: new Date().toISOString(),
  };

  users.set(normalizedEmail, userData);

  const sessionToken = generateSessionToken();
  sessions.set(sessionToken, {
    email: normalizedEmail,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    email: normalizedEmail,
    sessionToken,
    expiresIn: 24 * 60 * 60,
  });
}
