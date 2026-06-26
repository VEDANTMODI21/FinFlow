export interface ServerLog {
  id: string;
  timestamp: string;
  level: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  service: string;
  message: string;
}

export interface MockEmail {
  id: string;
  to: string;
  from: string;
  subject: string;
  html: string;
  timestamp: string;
  otp: string;
}

export interface ConfigStatus {
  hasResendKey: boolean;
  hasBrevoKey: boolean;
  senderEmail: string;
  senderName: string;
}

export type FlowStep = "idle" | "requesting" | "generating" | "sending" | "sent" | "verifying" | "verified" | "failed";

export interface Transaction {
  id: string;
  email: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

export interface UserBudgetData {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  savingsGoals: SavingsGoal[];
  password?: string;
}
