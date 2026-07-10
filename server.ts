import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface OtpStore {
  otp: string;
  expiresAt: number;
}

interface MockEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  timestamp: string;
  otp: string;
}

interface ServerLog {
  id: string;
  timestamp: string;
  level: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  service: string;
  message: string;
}

interface AuthSession {
  sessionToken: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

interface Transaction {
  id: string;
  email: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface CategoryBudget {
  category: string;
  limit: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

interface UserBudgetData {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  password?: string;
}

interface DbSchema {
  users: {
    [email: string]: UserBudgetData;
  };
}

const app = express();
const PORT = 3000;
const DB_FILE_PATH = path.join(process.cwd(), "db.json");

app.use(express.json());

// In-memory runtime queues for logs and mock inbox
const mockEmails: MockEmail[] = [];
const serverLogs: ServerLog[] = [];
const otps = new Map<string, OtpStore>();
const sessions = new Map<string, AuthSession>();

// Helper to log events
function addLog(level: "INFO" | "SUCCESS" | "WARNING" | "ERROR", service: string, message: string) {
  const log: ServerLog = {
    id: Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toLocaleTimeString(),
    level,
    service,
    message,
  };
  serverLogs.unshift(log);
  if (serverLogs.length > 100) serverLogs.pop();
  console.log(`[${log.timestamp}] [${level}] [${service}] ${message}`);
}

// Ensure local JSON DB file exists and contains schema
function initDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      const initialDb: DbSchema = { users: {} };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(initialDb, null, 2), "utf8");
      addLog("INFO", "Database", "New persistent JSON database 'db.json' initialized.");
      return initialDb;
    }
    const data = fs.readFileSync(DB_FILE_PATH, "utf8");
    return JSON.parse(data) as DbSchema;
  } catch (err: any) {
    addLog("ERROR", "Database", `Failed to load database: ${err.message}`);
    return { users: {} };
  }
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err: any) {
    addLog("ERROR", "Database", `Failed to write database: ${err.message}`);
  }
}

// Load DB initially
let database = initDb();

// Helper to get or create a user's budget data
function getUserData(email: string): UserBudgetData {
  const key = email.toLowerCase().trim();
  if (!database.users[key]) {
    database.users[key] = {
      transactions: [
        {
          id: "t_init_0",
          email: key,
          type: "income",
          amount: 10400.25,
          category: "Salary",
          date: "2024-05-31",
          description: "Starting Balance Carryover",
        },
        {
          id: "t_init_1",
          email: key,
          type: "income",
          amount: 5200.00,
          category: "Salary",
          date: "2024-06-01",
          description: "Monthly Direct Deposit",
        },
        {
          id: "t_init_2",
          email: key,
          type: "expense",
          amount: 1350.00,
          category: "Rent & Utilities",
          date: "2024-06-01",
          description: "Apartment Rental & Utilities",
        },
        {
          id: "t_init_3",
          email: key,
          type: "expense",
          amount: 160.00,
          category: "Transportation",
          date: "2024-06-02",
          description: "Monthly Transit Pass",
        },
        {
          id: "t_init_4",
          email: key,
          type: "expense",
          amount: 387.35,
          category: "Food & Dining",
          date: "2024-06-03",
          description: "Weekly Groceries",
        },
        {
          id: "t_init_5",
          email: key,
          type: "expense",
          amount: 1070.00,
          category: "Savings Transfer",
          date: "2024-06-05",
          description: "Transfer to Emergency Fund",
        },
        {
          id: "t_init_6",
          email: key,
          type: "expense",
          amount: 15.99,
          category: "Entertainment",
          date: "2024-06-13",
          description: "Netflix Subscription",
        },
        {
          id: "t_init_7",
          email: key,
          type: "expense",
          amount: 120.15,
          category: "Food & Dining",
          date: "2024-06-14",
          description: "Trader Joe's",
        },
        {
          id: "t_init_8",
          email: key,
          type: "expense",
          amount: 34.01,
          category: "Entertainment",
          date: "2024-06-14",
          description: "Amazon Order",
        },
        {
          id: "t_init_9",
          email: key,
          type: "expense",
          amount: 12.50,
          category: "Food & Dining",
          date: "2024-06-15",
          description: "Starbucks",
        }
      ],
      budgets: [
        { category: "Food & Dining", limit: 800 },
        { category: "Rent & Utilities", limit: 1500 },
        { category: "Transportation", limit: 400 },
        { category: "Entertainment", limit: 200 },
        { category: "Savings Transfer", limit: 1500 },
      ],
      savingsGoals: [
        { id: "g_init_1", name: "Emergency Fund", target: 10000, current: 4500 },
      ],
    };
    saveDb(database);
    addLog("SUCCESS", "Database", `Created initial template budget tracking profile for user: ${email}`);
  }
  return database.users[key];
}

// Initial logs to represent system bootup
addLog("INFO", "System", "Server initialized on port 3000.");
addLog("INFO", "Database", "OTP registry cache cleared.");

// --- AUTHENTICATION & CONFIG ENDPOINTS ---

// 1. Get Config status
app.get("/api/config", (req, res) => {
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasBrevoKey = !!process.env.BREVO_API_KEY;
  res.json({
    hasResendKey,
    hasBrevoKey,
    senderEmail: process.env.SENDER_EMAIL || "onboarding@resend.dev",
    senderName: process.env.SENDER_NAME || "FinFlow",
  });
});

// 2. Get Logs
app.get("/api/logs", (req, res) => {
  res.json(serverLogs);
});

// 3. Clear Logs
app.post("/api/logs/clear", (req, res) => {
  serverLogs.length = 0;
  addLog("INFO", "System", "Server-side logs cleared.");
  res.json({ success: true });
});

// 4. Get Mock Inbox (for sandbox/preview usage)
app.get("/api/mock-inbox", (req, res) => {
  res.json(mockEmails);
});

// 5. Clear Mock Inbox
app.post("/api/mock-inbox/clear", (req, res) => {
  mockEmails.length = 0;
  addLog("INFO", "Mailbox", "Mock inbox cleared.");
  res.json({ success: true });
});

// 6. Generate and send OTP
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.includes("@")) {
    addLog("ERROR", "Validator", `Invalid email address submitted: ${email}`);
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

  otps.set(email.toLowerCase(), { otp, expiresAt });
  addLog("INFO", "OTP-Engine", `Generated secure OTP [******] for ${email}`);

  // HTML email template
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
          Welcome to FinFlow Personal Budget Manager. Use the authorization code below to verify your email and securely access your database dashboard:
        </p>
        <div style="background-color: #000000; border: 1px solid #222222; padding: 20px; text-align: center; margin-bottom: 24px; border-radius: 6px;">
          <span style="font-family: monospace; font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #3b82f6;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #888888; margin: 0 0 12px 0; line-height: 1.4;">
          This code is highly sensitive and is valid for <strong>5 minutes</strong>. If you did not make this request, please ignore this message.
        </p>
        <div style="border-top: 1px solid #222222; padding-top: 16px; margin-top: 24px; font-size: 10px; color: #555555; text-align: center; font-family: monospace;">
          FinFlow Node • Automated Cryptographic Verification
        </div>
      </div>
    </div>
  `;

  let sentRealEmail = false;
  let serviceUsed = "Sandbox";

  try {
    if (process.env.RESEND_API_KEY) {
      serviceUsed = "Resend";
      addLog("INFO", "Resend", `Initiating delivery to ${email} via Resend...`);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [email],
          subject: `${otp} is your verification code`,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        sentRealEmail = true;
        addLog("SUCCESS", "Resend", `Successfully dispatched OTP email to ${email}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || JSON.stringify(errorData) || `HTTP error ${response.status}`);
      }
    } 
    else if (process.env.BREVO_API_KEY) {
      serviceUsed = "Brevo";
      addLog("INFO", "Brevo", `Initiating delivery to ${email} via Brevo...`);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email }],
          subject: `${otp} is your verification code`,
          htmlContent: emailHtml,
        }),
      });

      if (response.ok) {
        sentRealEmail = true;
        addLog("SUCCESS", "Brevo", `Successfully dispatched OTP email to ${email}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || JSON.stringify(errorData) || `HTTP error ${response.status}`);
      }
    } else {
      addLog("ERROR", "OTP-Engine", `Email service not configured. Set RESEND_API_KEY or BREVO_API_KEY.`);
      return res.status(500).json({
        success: false,
        error: "Email service not configured. Please contact administrator."
      });
    }
  } catch (error: any) {
    addLog("ERROR", serviceUsed, `Failed to send OTP: ${error.message || error}`);
    return res.status(500).json({
      success: false,
      error: `Failed to deliver email via ${serviceUsed}: ${error.message || "Unknown mailer error."}`
    });
  }

  // Store in mock inbox for offline references
  const mockEmail: MockEmail = {
    id: Math.random().toString(36).substring(2, 11),
    to: email,
    from: `${senderName} <${senderEmail}>`,
    subject: `${otp} is your verification code`,
    html: emailHtml,
    timestamp: new Date().toLocaleTimeString(),
    otp,
  };
  mockEmails.unshift(mockEmail);
  if (mockEmails.length > 50) mockEmails.pop();

  res.json({
    success: true,
    email,
    message: "OTP sent to your email. Please check your inbox."
  });
});

// 7. Verify OTP
app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    addLog("ERROR", "Validator", "Verification failed: missing email or code.");
    return res.status(400).json({ success: false, error: "Email and OTP code are required." });
  }

  const record = otps.get(email.toLowerCase());

  if (!record) {
    addLog("WARNING", "OTP-Engine", `Verification rejected: No OTP active for ${email}`);
    return res.status(400).json({ success: false, error: "No active OTP found. Please request a new code." });
  }

  if (Date.now() > record.expiresAt) {
    otps.delete(email.toLowerCase());
    addLog("WARNING", "OTP-Engine", `Verification expired: Code for ${email} was too old.`);
    return res.status(400).json({ success: false, error: "This OTP has expired. Please request a new code." });
  }

  if (record.otp !== otp.trim()) {
    addLog("WARNING", "OTP-Engine", `Verification mismatch: Invalid code submitted for ${email}`);
    return res.status(400).json({ success: false, error: "Invalid authorization code." });
  }

  // Success! Clear OTP & bootstrap template profile if empty
  otps.delete(email.toLowerCase());
  addLog("SUCCESS", "Auth-Router", `SUCCESSFULLY AUTHENTICATED user session: ${email}`);

  // Create template profile on first login to make sure it's ready
  getUserData(email);

  const sessionToken = "session_" + Math.random().toString(36).substring(2, 18);
  const session: AuthSession = {
    sessionToken,
    email: email.toLowerCase().trim(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  sessions.set(sessionToken, session);

  res.json({
    success: true,
    email: email.toLowerCase().trim(),
    sessionToken,
    expiresIn: 24 * 60 * 60, // seconds
  });
});

// Check if email has a registered account and password
app.post("/api/check-email", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required." });
  }
  const key = email.toLowerCase().trim();
  const user = database.users[key];
  res.json({
    success: true,
    exists: !!user,
    hasPassword: !!(user && user.password),
  });
});

// Set password for an account (called after successful OTP verification on signup)
app.post("/api/set-password", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required." });
  }
  const key = email.toLowerCase().trim();
  const userData = getUserData(key); // creates user if doesn't exist
  userData.password = password;
  saveDb(database);
  addLog("SUCCESS", "Auth-Router", `Set unique password for user: ${email}`);
  res.json({ success: true, email: key });
});

// Sign in directly using email + password
app.post("/api/login-password", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    addLog("WARNING", "Auth", "Login attempt with missing credentials");
    return res.status(400).json({ success: false, error: "Email and password are required." });
  }
  const key = email.toLowerCase().trim();
  const userData = database.users[key];
  if (!userData || !userData.password) {
    addLog("WARNING", "Auth", `Login failed: account not found or not registered: ${email}`);
    return res.status(400).json({ success: false, error: "Account does not exist. Please register using OTP first." });
  }
  if (userData.password !== password) {
    addLog("WARNING", "Auth-Router", `Password verification failed for user: ${email}`);
    return res.status(400).json({ success: false, error: "Incorrect password." });
  }
  addLog("SUCCESS", "Auth-Router", `SUCCESSFULLY AUTHENTICATED via password: ${email}`);
  
  const sessionToken = "session_" + Math.random().toString(36).substring(2, 18);
  const session: AuthSession = {
    sessionToken,
    email: key,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  sessions.set(sessionToken, session);
  
  res.json({ 
    success: true, 
    email: key,
    sessionToken,
    expiresIn: 24 * 60 * 60, // seconds
  });
});

// Session validation endpoint
app.post("/api/validate-session", (req, res) => {
  const { sessionToken } = req.body;
  if (!sessionToken) {
    return res.status(400).json({ success: false, error: "Session token required." });
  }

  const session = sessions.get(sessionToken);
  if (!session || Date.now() > session.expiresAt) {
    if (session) sessions.delete(sessionToken);
    addLog("WARNING", "Auth", "Session validation failed or expired");
    return res.status(401).json({ success: false, error: "Session expired. Please log in again." });
  }

  res.json({ 
    success: true, 
    email: session.email,
    expiresIn: Math.floor((session.expiresAt - Date.now()) / 1000),
  });
});

// --- BUDGET TRACKER API ENDPOINTS ---

// Check session / authentication helper (simple simulation)
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const email = req.headers["x-user-email"] as string;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(401).json({ success: false, error: "Unauthorized access. Please log in." });
  }
  next();
}

// 8. Get Budget Data (Transactions, Budgets, Savings Goals)
app.get("/api/budget-data", requireAuth, (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const userData = getUserData(email);
  res.json({ success: true, ...userData });
});

// 9. Add Transaction
app.post("/api/transactions", requireAuth, (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { type, amount, category, date, description } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ success: false, error: "Missing required transaction fields." });
  }

  if (type !== "income" && type !== "expense") {
    return res.status(400).json({ success: false, error: "Invalid type. Must be income or expense." });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, error: "Amount must be a positive number." });
  }

  const userData = getUserData(email);
  const newTransaction: Transaction = {
    id: "t_" + Math.random().toString(36).substring(2, 11),
    email: email.toLowerCase().trim(),
    type,
    amount: numericAmount,
    category,
    date,
    description: description || "",
  };

  userData.transactions.unshift(newTransaction);
  saveDb(database);

  addLog(
    type === "income" ? "SUCCESS" : "INFO",
    "Budget-Engine",
    `Added ${type}: $${numericAmount.toFixed(2)} in '${category}' for user ${email}`
  );

  res.json({ success: true, transaction: newTransaction, data: userData });
});

// 10. Delete Transaction
app.delete("/api/transactions/:id", requireAuth, (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { id } = req.params;

  const userData = getUserData(email);
  const initialLen = userData.transactions.length;
  userData.transactions = userData.transactions.filter(t => t.id !== id);

  if (userData.transactions.length === initialLen) {
    return res.status(404).json({ success: false, error: "Transaction not found." });
  }

  saveDb(database);
  addLog("INFO", "Budget-Engine", `Removed transaction record [${id}] for user ${email}`);

  res.json({ success: true, data: userData });
});

// 11. Set/Update Category Budget Limit
app.post("/api/budgets", requireAuth, (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { category, limit } = req.body;

  if (!category || limit === undefined) {
    return res.status(400).json({ success: false, error: "Category and limit are required." });
  }

  const numericLimit = parseFloat(limit);
  if (isNaN(numericLimit) || numericLimit < 0) {
    return res.status(400).json({ success: false, error: "Limit must be a non-negative number." });
  }

  const userData = getUserData(email);
  const existingBudget = userData.budgets.find(b => b.category.toLowerCase() === category.toLowerCase());

  if (existingBudget) {
    existingBudget.limit = numericLimit;
    // Standardize category name casing
    existingBudget.category = category;
  } else {
    userData.budgets.push({ category, limit: numericLimit });
  }

  saveDb(database);
  addLog("SUCCESS", "Budget-Engine", `Updated category budget for '${category}' to $${numericLimit} for user ${email}`);

  res.json({ success: true, data: userData });
});

// 12. Add or Update Savings Goal
app.post("/api/savings-goals", requireAuth, (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { id, name, target, current, deadline } = req.body;

  if (!name || target === undefined) {
    return res.status(400).json({ success: false, error: "Goal name and target amount are required." });
  }

  const numTarget = parseFloat(target);
  const numCurrent = parseFloat(current || 0);

  if (isNaN(numTarget) || numTarget <= 0) {
    return res.status(400).json({ success: false, error: "Target amount must be a positive number." });
  }

  const userData = getUserData(email);

  if (id) {
    // Update existing
    const goal = userData.savingsGoals.find(g => g.id === id);
    if (!goal) {
      return res.status(404).json({ success: false, error: "Savings goal not found." });
    }
    goal.name = name;
    goal.target = numTarget;
    goal.current = isNaN(numCurrent) ? goal.current : numCurrent;
    if (deadline !== undefined) goal.deadline = deadline;
    addLog("INFO", "Budget-Engine", `Updated savings goal '${name}' for user ${email}`);
  } else {
    // Add new
    const newGoal: SavingsGoal = {
      id: "g_" + Math.random().toString(36).substring(2, 11),
      name,
      target: numTarget,
      current: isNaN(numCurrent) ? 0 : numCurrent,
      deadline: deadline || undefined,
    };
    userData.savingsGoals.push(newGoal);
    addLog("SUCCESS", "Budget-Engine", `Created new savings goal '${name}' with target $${numTarget} for user ${email}`);
  }

  saveDb(database);
  res.json({ success: true, data: userData });
});

// 13. Contribute to Savings Goal
app.post("/api/savings-goals/:id/contribute", requireAuth, (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { id } = req.params;
  const { amount } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount === 0) {
    return res.status(400).json({ success: false, error: "Contribution amount must be a valid non-zero number." });
  }

  const userData = getUserData(email);
  const goal = userData.savingsGoals.find(g => g.id === id);

  if (!goal) {
    return res.status(404).json({ success: false, error: "Savings goal not found." });
  }

  // Adjust balance
  goal.current = Math.max(0, goal.current + numAmount);

  // Also automatically log as transaction if it's a contribution from checking (expense)
  if (numAmount > 0) {
    const autoTx: Transaction = {
      id: "t_goal_" + Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase().trim(),
      type: "expense",
      amount: numAmount,
      category: "Savings Transfer",
      date: new Date().toISOString().split("T")[0],
      description: `Fund allocation to goal: '${goal.name}'`,
    };
    userData.transactions.unshift(autoTx);
    addLog("SUCCESS", "Budget-Engine", `Transferred $${numAmount} to savings goal '${goal.name}' for user ${email}`);
  } else {
    // Negative contribution means withdrawal back to checking (income)
    const withdrawAmount = Math.abs(numAmount);
    const autoTx: Transaction = {
      id: "t_goal_" + Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase().trim(),
      type: "income",
      amount: withdrawAmount,
      category: "Savings Withdrawal",
      date: new Date().toISOString().split("T")[0],
      description: `Withdrew from goal: '${goal.name}'`,
    };
    userData.transactions.unshift(autoTx);
    addLog("INFO", "Budget-Engine", `Withdrew $${withdrawAmount} from savings goal '${goal.name}' to balance for user ${email}`);
  }

  saveDb(database);
  res.json({ success: true, data: userData });
});

// 14. Delete Savings Goal
app.delete("/api/savings-goals/:id", requireAuth, (req, res) => {
  const email = req.headers["x-user-email"] as string;
  const { id } = req.params;

  const userData = getUserData(email);
  const initialLen = userData.savingsGoals.length;
  userData.savingsGoals = userData.savingsGoals.filter(g => g.id !== id);

  if (userData.savingsGoals.length === initialLen) {
    return res.status(404).json({ success: false, error: "Savings goal not found." });
  }

  saveDb(database);
  addLog("INFO", "Budget-Engine", `Deleted savings goal [${id}] for user ${email}`);

  res.json({ success: true, data: userData });
});


// --- INITIALIZE SERVER & VITE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Serve static files but skip /api routes
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      express.static(distPath)(req, res, next);
    });
    // Fallback to index.html for SPA routing (only for non-API routes)
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(distPath, "index.html"));
      } else {
        res.status(404).json({ error: "API endpoint not found" });
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Booted. Running on http://localhost:${PORT}`);
  });
}

startServer();
