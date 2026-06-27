import { VercelRequest, VercelResponse } from "@vercel/node";

// In-memory data storage (shared across requests)
const userData = new Map<string, {
  email: string;
  transactions: any[];
  budgets: any[];
  savingsGoals: any[];
}>();

// Helper to get or create user data
function getUserData(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  if (!userData.has(normalizedEmail)) {
    userData.set(normalizedEmail, {
      email: normalizedEmail,
      transactions: [],
      budgets: [],
      savingsGoals: []
    });
  }
  return userData.get(normalizedEmail)!;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, email, sessionToken, id } = req.query;

  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    // GET BUDGET DATA
    if (req.method === "GET" && req.url?.includes("/api/budget-data")) {
      const userEmail = req.headers["x-user-email"] as string;
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const data = getUserData(userEmail);
      return res.status(200).json({
        success: true,
        transactions: data.transactions,
        budgets: data.budgets,
        savingsGoals: data.savingsGoals,
        totalIncome: 5000,
        totalExpenses: 2100,
        savingsRate: 58,
        budgetUtilization: 42
      });
    }

    // GET TRANSACTIONS
    if (req.method === "GET" && req.url?.includes("/api/transactions")) {
      const userEmail = req.headers["x-user-email"] as string;
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const data = getUserData(userEmail);
      return res.status(200).json({
        success: true,
        data: data.transactions
      });
    }

    // POST TRANSACTION
    if (req.method === "POST" && req.url?.includes("/api/transactions")) {
      const userEmail = req.headers["x-user-email"] as string;
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { description, amount, category, date } = req.body;
      const data = getUserData(userEmail);
      
      const transaction = {
        id: `trans_${Date.now()}`,
        description,
        amount,
        category,
        date,
        createdAt: new Date().toISOString()
      };

      data.transactions.push(transaction);
      
      return res.status(200).json({
        success: true,
        data: transaction
      });
    }

    // GET BUDGETS
    if (req.method === "GET" && req.url?.includes("/api/budgets")) {
      const userEmail = req.headers["x-user-email"] as string;
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const data = getUserData(userEmail);
      
      // Return default budgets if none exist
      if (data.budgets.length === 0) {
        data.budgets = [
          { id: "budget_1", category: "Food", limit: 500, spent: 320, percentage: 64 },
          { id: "budget_2", category: "Transport", limit: 300, spent: 210, percentage: 70 },
          { id: "budget_3", category: "Entertainment", limit: 200, spent: 85, percentage: 42 },
          { id: "budget_4", category: "Utilities", limit: 400, spent: 350, percentage: 87 },
          { id: "budget_5", category: "Healthcare", limit: 200, spent: 95, percentage: 47 }
        ];
      }

      return res.status(200).json({
        success: true,
        data: data.budgets
      });
    }

    // POST BUDGET
    if (req.method === "POST" && req.url?.includes("/api/budgets")) {
      const userEmail = req.headers["x-user-email"] as string;
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { category, limit } = req.body;
      const data = getUserData(userEmail);
      
      const budget = {
        id: `budget_${Date.now()}`,
        category,
        limit,
        spent: 0,
        percentage: 0,
        createdAt: new Date().toISOString()
      };

      data.budgets.push(budget);
      
      return res.status(200).json({
        success: true,
        data: budget
      });
    }

    // GET SAVINGS GOALS
    if (req.method === "GET" && req.url?.includes("/api/savings-goals")) {
      const userEmail = req.headers["x-user-email"] as string;
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const data = getUserData(userEmail);
      
      // Return default savings goals if none exist
      if (data.savingsGoals.length === 0) {
        data.savingsGoals = [
          { id: "goal_1", name: "Emergency Fund", target: 5000, current: 2500, percentage: 50, deadline: "2025-12-31" },
          { id: "goal_2", name: "Vacation", target: 3000, current: 1200, percentage: 40, deadline: "2025-06-30" },
          { id: "goal_3", name: "New Laptop", target: 2000, current: 800, percentage: 40, deadline: "2025-09-30" }
        ];
      }

      return res.status(200).json({
        success: true,
        data: data.savingsGoals
      });
    }

    // POST SAVINGS GOAL
    if (req.method === "POST" && req.url?.includes("/api/savings-goals")) {
      const userEmail = req.headers["x-user-email"] as string;
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { name, target, deadline } = req.body;
      const data = getUserData(userEmail);
      
      const goal = {
        id: `goal_${Date.now()}`,
        name,
        target,
        current: 0,
        percentage: 0,
        deadline,
        createdAt: new Date().toISOString()
      };

      data.savingsGoals.push(goal);
      
      return res.status(200).json({
        success: true,
        data: goal
      });
    }

    // CONTRIBUTE TO SAVINGS GOAL
    if (req.method === "POST" && req.url?.includes("/api/savings-goals") && req.url?.includes("contribute")) {
      const userEmail = req.headers["x-user-email"] as string;
      const goalId = req.url?.split("/")[4];
      
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const { amount } = req.body;
      const data = getUserData(userEmail);
      
      const goal = data.savingsGoals.find((g: any) => g.id === goalId);
      if (!goal) {
        return res.status(404).json({ success: false, error: "Goal not found" });
      }

      goal.current += amount;
      goal.percentage = Math.min(100, (goal.current / goal.target) * 100);

      return res.status(200).json({
        success: true,
        data: goal
      });
    }

    // DELETE TRANSACTION
    if (req.method === "DELETE" && req.url?.includes("/api/transactions")) {
      const userEmail = req.headers["x-user-email"] as string;
      const transId = req.url?.split("/")[4];
      
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const data = getUserData(userEmail);
      data.transactions = data.transactions.filter((t: any) => t.id !== transId);

      return res.status(200).json({
        success: true,
        message: "Transaction deleted"
      });
    }

    // DELETE SAVINGS GOAL
    if (req.method === "DELETE" && req.url?.includes("/api/savings-goals")) {
      const userEmail = req.headers["x-user-email"] as string;
      const goalId = req.url?.split("/")[4];
      
      if (!userEmail) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
      }

      const data = getUserData(userEmail);
      data.savingsGoals = data.savingsGoals.filter((g: any) => g.id !== goalId);

      return res.status(200).json({
        success: true,
        message: "Goal deleted"
      });
    }

    return res.status(404).json({ success: false, error: "Endpoint not found" });

  } catch (error: any) {
    console.error("[Data API Error]", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
}
