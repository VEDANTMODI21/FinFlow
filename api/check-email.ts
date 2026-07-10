import { VercelRequest, VercelResponse } from "@vercel/node";

// In-memory user database
const users = new Map<string, any>();

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      error: "Email is required"
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = users.get(normalizedEmail);
  const exists = !!user;
  const hasPassword = exists && !!user.password;

  res.status(200).json({
    success: true,
    exists,
    hasPassword,
  });
}
