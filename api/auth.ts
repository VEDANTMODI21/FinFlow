import { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import path from "path";

// In-memory OTP storage
const otps = new Map<string, { code: string; expiresAt: number }>();
const sessions = new Map<
  string,
  { email: string; createdAt: number; expiresAt: number }
>();

// Database path
const dbPath = path.join(process.cwd(), "db.json");

interface Database {
  users: Record<string, any>;
}

// Read database
function readDatabase(): Database {
  try {
    const data = fs.readFileSync(dbPath, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: {} };
  }
}

// Write database
function writeDatabase(db: Database) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken(): string {
  return "session_" + Math.random().toString(36).substring(2, 18);
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  const { action, email, password, otp } = req.body;

  // CHECK EMAIL
  if (action === "check-email") {
    const db = readDatabase();
    const normalizedEmail = email.toLowerCase().trim();
    const exists = !!db.users[normalizedEmail];
    const hasPassword = exists && !!db.users[normalizedEmail].password;

    return res.status(200).json({
      success: true,
      exists,
      hasPassword,
    });
  }

  // SEND OTP
  if (action === "send-otp") {
    const normalizedEmail = email.toLowerCase().trim();
    const code = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otps.set(normalizedEmail, { code, expiresAt });

    // Log OTP for development/testing
    console.log(`[OTP] Email: ${normalizedEmail}, Code: ${code}, Expires: ${new Date(expiresAt).toISOString()}`);
    
    // TODO: In production, integrate with Resend or Brevo
    // For now, return success with OTP in development mode
    const isDevelopment = process.env.NODE_ENV !== "production" || !process.env.RESEND_API_KEY;
    
    return res.status(200).json({
      success: true,
      message: isDevelopment 
        ? `OTP sent to ${normalizedEmail}. Dev mode - Check deployment logs or use: ${code}`
        : `OTP sent to ${normalizedEmail}. Check your email.`,
      ...(isDevelopment && { devOtp: code }), // Include OTP in dev mode for testing
    });
  }

  // VERIFY OTP
  if (action === "verify-otp") {
    const normalizedEmail = email.toLowerCase().trim();
    const stored = otps.get(normalizedEmail);

    if (!stored || Date.now() > stored.expiresAt) {
      otps.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        error: "OTP expired or not found. Request a new code.",
      });
    }

    if (stored.code !== otp.trim()) {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP code. Please check and try again.",
      });
    }

    otps.delete(normalizedEmail);

    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, {
      email: normalizedEmail,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      sessionToken,
      expiresIn: 24 * 60 * 60,
    });
  }

  // SET PASSWORD (New user)
  if (action === "set-password") {
    const normalizedEmail = email.toLowerCase().trim();
    const db = readDatabase();

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters.",
      });
    }

    if (!db.users[normalizedEmail]) {
      db.users[normalizedEmail] = {
        email: normalizedEmail,
        password,
        transactions: [],
        budgets: [],
        savingsGoals: [],
        createdAt: new Date().toISOString(),
      };
    } else {
      db.users[normalizedEmail].password = password;
    }

    writeDatabase(db);

    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, {
      email: normalizedEmail,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      email: normalizedEmail,
      sessionToken,
      expiresIn: 24 * 60 * 60,
    });
  }

  // LOGIN PASSWORD
  if (action === "login-password") {
    const normalizedEmail = email.toLowerCase().trim();
    const db = readDatabase();

    const user = db.users[normalizedEmail];
    if (!user || !user.password) {
      return res.status(400).json({
        success: false,
        error: "Account not found. Please sign up first.",
      });
    }

    if (user.password !== password) {
      return res.status(400).json({
        success: false,
        error: "Invalid password. Please try again.",
      });
    }

    const sessionToken = generateSessionToken();
    sessions.set(sessionToken, {
      email: normalizedEmail,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      email: normalizedEmail,
      sessionToken,
      expiresIn: 24 * 60 * 60,
    });
  }

  // VALIDATE SESSION
  if (action === "validate-session") {
    const { sessionToken } = req.body;
    const session = sessions.get(sessionToken);

    if (!session || Date.now() > session.expiresAt) {
      if (session) sessions.delete(sessionToken);
      return res.status(401).json({
        success: false,
        error: "Session expired. Please log in again.",
      });
    }

    return res.status(200).json({
      success: true,
      email: session.email,
      expiresIn: Math.floor((session.expiresAt - Date.now()) / 1000),
    });
  }

  // Config endpoint
  if (action === "config") {
    return res.status(200).json({
      success: true,
      service: "FinFlow Auth API",
      status: "online",
    });
  }

  return res.status(400).json({
    success: false,
    error: "Invalid action",
  });
}
