import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  DollarSign,
  PiggyBank,
  Plus,
  Trash2,
  Search,
  Check,
  Calendar,
  AlertTriangle,
  LogOut,
  Mail,
  Terminal,
  X,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Sliders,
  ChevronRight,
  TrendingUp,
  Percent,
  Sparkles,
  PieChart as PieIcon,
  Wifi,
  Zap,
  MoreHorizontal,
  Sun,
  Moon,
  FileSpreadsheet,
  FileText,
  Download,
  User
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Transaction, CategoryBudget, SavingsGoal, UserBudgetData } from "../types";

interface BudgetTrackerProps {
  userEmail: string;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

type TabType = "dashboard" | "transactions" | "budgets" | "reports" | "settings";

export default function BudgetTracker({
  userEmail,
  onLogout,
  isDarkMode,
  onToggleDarkMode
}: BudgetTrackerProps) {
  const [data, setData] = useState<UserBudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Filter & Search State for Transactions Tab
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add Transaction Modal / Form State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("expense");
  const [txAmount, setTxAmount] = useState("");
  const [txCategory, setTxCategory] = useState("Food & Dining");
  const [customCategory, setCustomCategory] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txDesc, setTxDesc] = useState("");

  // Edit Budget Limit State
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingLimitValue, setEditingLimitValue] = useState("");

  // Add Budget Category Form
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [newBudgetLimit, setNewBudgetLimit] = useState("");
  const [isAddingBudget, setIsAddingBudget] = useState(false);

  // New Savings Goal State
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");
  const [isAddingGoal, setIsAddingGoal] = useState(false);

  // Savings Goal Deposit / Withdrawal Popup
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [contribType, setContribType] = useState<"deposit" | "withdraw">("deposit");
  const [contribAmount, setContribAmount] = useState("");

  // Notifications state
  const [notifications, setNotifications] = useState<string[]>([
    "Welcome back to FinFlow! Your budget health is Excellent.",
    "Electric Bill is due in 6 days.",
    "Internet Subscription will be debited on June 25."
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<Record<string, boolean>>({});
  const toggleReminder = (billName: string) => {
    setReminders(prev => {
      const next = !prev[billName];
      if (next) {
        setNotifications(p => [`Reminder set for: ${billName}! We will alert you on the due date.`, ...p]);
      } else {
        setNotifications(p => [`Reminder cleared for: ${billName}.`, ...p]);
      }
      return { ...prev, [billName]: next };
    });
  };

  // Keyboard shortcut Ctrl+E for Quick Add Expense
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        setTxType("expense");
        setIsTxModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch all budget profile data
  const fetchBudgetData = async () => {
    try {
      const res = await fetch("/api/budget-data", {
        headers: {
          "x-user-email": userEmail
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData({
            transactions: json.transactions || [],
            budgets: json.budgets || [],
            savingsGoals: json.savingsGoals || []
          });
          setError(null);
        } else {
          setError(json.error || "Failed to load budget profile.");
        }
      } else {
        setError("Network response error while fetching budget data.");
      }
    } catch (e) {
      console.error("Failed to load budget tracking data:", e);
      setError("Failed to connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
    const interval = setInterval(fetchBudgetData, 5000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Handle adding transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || parseFloat(txAmount) <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    const finalCategory = txCategory === "Custom" && customCategory.trim() ? customCategory.trim() : txCategory;

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          type: txType,
          amount: parseFloat(txAmount),
          category: finalCategory,
          date: txDate,
          description: txDesc
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          // Reset transaction form state
          setTxAmount("");
          setTxDesc("");
          setIsTxModalOpen(false);
          if (txCategory === "Custom") {
            setTxCategory("Food & Dining");
            setCustomCategory("");
          }
          // Add notification success
          setNotifications(prev => [
            `Transaction of $${parseFloat(txAmount).toFixed(2)} added successfully.`,
            ...prev
          ]);
        } else {
          alert(json.error || "Failed to add transaction.");
        }
      }
    } catch (err) {
      console.error("Failed to add transaction:", err);
    }
  };

  // Handle transaction deletion
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-email": userEmail
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Excel (CSV) Statement Export
  const handleExportCSV = () => {
    const headers = ["ID", "Date", "Description", "Category", "Type", "Amount"];
    const csvRows = [headers.join(",")];
    filteredTransactions.forEach(tx => {
      const values = [
        tx.id,
        tx.date,
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${tx.category.replace(/"/g, '""')}"`,
        tx.type,
        tx.amount.toFixed(2)
      ];
      csvRows.push(values.join(","));
    });
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `FinFlow_Ledger_${userEmail}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle PDF Statement Print Export
  const handleExportPDF = () => {
    window.print();
  };

  // Handle budget limit update
  const handleUpdateBudget = async (category: string, limitVal: string) => {
    const parsedLimit = parseFloat(limitVal);
    if (isNaN(parsedLimit) || parsedLimit < 0) {
      alert("Please enter a valid positive budget limit.");
      return;
    }

    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          category,
          limit: parsedLimit
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setEditingCategory(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle adding savings goal
  const handleAddSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTarget || parseFloat(goalTarget) <= 0) {
      alert("Goal Name and positive Target Amount are required.");
      return;
    }

    try {
      const res = await fetch("/api/savings-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          name: goalName,
          target: parseFloat(goalTarget),
          current: parseFloat(goalCurrent) || 0,
          deadline: goalDeadline || undefined
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setIsAddingGoal(false);
          setGoalName("");
          setGoalTarget("");
          setGoalCurrent("");
          setGoalDeadline("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Goal Contribution
  const handleGoalContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !contribAmount) return;
    const parsedAmount = parseFloat(contribAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid positive contribution amount.");
      return;
    }

    const finalAmount = contribType === "deposit" ? parsedAmount : -parsedAmount;

    try {
      const res = await fetch(`/api/savings-goals/${selectedGoalId}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          amount: finalAmount
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setSelectedGoalId(null);
          setContribAmount("");
          // Record corresponding transaction automatically to keep balance correct
          await fetch("/api/transactions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-email": userEmail
            },
            body: JSON.stringify({
              type: contribType === "deposit" ? "expense" : "income",
              amount: parsedAmount,
              category: "Savings Transfer",
              date: new Date().toISOString().split("T")[0],
              description: contribType === "deposit" 
                ? `Contribution to savings goal` 
                : `Withdrawal from savings goal`
            })
          });
          fetchBudgetData();
        } else {
          alert(json.error || "Transaction rejected.");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle savings goal deletion
  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this savings goal?")) return;
    try {
      const res = await fetch(`/api/savings-goals/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-email": userEmail
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pay upcoming bill
  const handlePayBill = async (billName: string, amount: number) => {
    if (!confirm(`Do you want to process payment for ${billName} of $${amount.toFixed(2)}?`)) return;
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": userEmail
        },
        body: JSON.stringify({
          type: "expense",
          amount: amount,
          category: "Rent & Utilities",
          date: new Date().toISOString().split("T")[0],
          description: `${billName} Payment`
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setNotifications(prev => [`Paid bill: ${billName} of $${amount}`, ...prev]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Get cumulative stats
  const transactions = data?.transactions || [];
  const budgets = data?.budgets || [];
  const savingsGoals = data?.savingsGoals || [];

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  
  // Calculate budget health score
  // Ideal: Expenses are less than 75% of income.
  // We start at 100 and deduct points if certain budgets are exceeded.
  let budgetHealthScore = 85; 
  let exceededCategoriesCount = 0;

  const budgetProgressList = budgets.map((b) => {
    const totalSpent = transactions
      .filter((t) => t.type === "expense" && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum, t) => sum + t.amount, 0);
    const percent = b.limit > 0 ? (totalSpent / b.limit) * 100 : 0;
    if (percent > 100) exceededCategoriesCount++;
    return {
      category: b.category,
      limit: b.limit,
      spent: totalSpent,
      percent: parseFloat(percent.toFixed(1))
    };
  });

  if (exceededCategoriesCount > 0) {
    budgetHealthScore = Math.max(40, 85 - exceededCategoriesCount * 15);
  } else if (totalExpenses > 0 && totalIncome > 0) {
    const expenseRatio = totalExpenses / totalIncome;
    if (expenseRatio < 0.5) budgetHealthScore = 95;
    else if (expenseRatio < 0.7) budgetHealthScore = 88;
    else if (expenseRatio < 0.85) budgetHealthScore = 78;
    else budgetHealthScore = 60;
  }

  // Filter transactions for table
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  // Unique categories list for filters
  const uniqueCategories = Array.from(new Set(transactions.map((t) => t.category)));

  // Recharts Data Prep: Daily trend for saving wave
  // Create 7 beautiful data points representing the trend
  const savingGoalValue = savingsGoals[0]?.current || 4500;
  const savingTrendData = [
    { day: "Jun 10", savings: savingGoalValue - 500 },
    { day: "Jun 11", savings: savingGoalValue - 420 },
    { day: "Jun 12", savings: savingGoalValue - 300 },
    { day: "Jun 13", savings: savingGoalValue - 150 },
    { day: "Jun 14", savings: savingGoalValue - 100 },
    { day: "Jun 15", savings: savingGoalValue }
  ];

  // Default Quick Categories for forms
  const defaultCategories = [
    "Food & Dining",
    "Rent & Utilities",
    "Transportation",
    "Entertainment",
    "Savings Transfer",
    "Salary",
    "Shopping",
    "Custom"
  ];

  // Colors for category progress indicators in Image 3
  const getCategoryColorClass = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes("food") || lower.includes("dining")) return "bg-emerald-500";
    if (lower.includes("rent") || lower.includes("utilities") || lower.includes("bill")) return "bg-blue-500";
    if (lower.includes("transport")) return "bg-orange-500";
    if (lower.includes("entertainment")) return "bg-amber-500";
    return "bg-purple-500";
  };

  const getCategoryTextClass = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes("food") || lower.includes("dining")) return "text-emerald-500";
    if (lower.includes("rent") || lower.includes("utilities") || lower.includes("bill")) return "text-blue-500";
    if (lower.includes("transport")) return "text-orange-500";
    if (lower.includes("entertainment")) return "text-amber-500";
    return "text-purple-500";
  };

  return (
    <div className={`min-h-[85vh] border rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl transition-all duration-300 no-print ${
      isDarkMode 
        ? "bg-[#030303] border-zinc-900 text-zinc-100" 
        : "bg-slate-50/70 border-slate-200/50 text-slate-800"
    }`}>
      {/* Embedded print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
            background: white !important;
            color: black !important;
          }
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
        @media screen {
          .print-only {
            display: none !important;
          }
        }
      `}</style>
      
      {/* 1. Left Sidebar Navigation - Matching Image 3 layout */}
      <aside className={`w-full md:w-64 border-b md:border-b-0 md:border-r flex flex-col justify-between shrink-0 transition-all duration-300 ${
        isDarkMode ? "bg-[#09090b] border-zinc-900" : "bg-white border-slate-100"
      }`}>
        <div className="p-6">
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3.5 mb-8">
            <div className="flex flex-col gap-1 items-end shrink-0">
              <div className="flex gap-1 items-end">
                <span className={`w-1.5 h-3.5 rounded-sm ${isDarkMode ? "bg-zinc-600" : "bg-blue-500"}`} />
                <span className={`w-1.5 h-5 rounded-sm ${isDarkMode ? "bg-zinc-400" : "bg-blue-600"}`} />
                <span className={`w-1.5 h-2.5 rounded-sm ${isDarkMode ? "bg-zinc-700" : "bg-blue-400"}`} />
              </div>
            </div>
            <div>
              <h2 className={`text-xl font-bold tracking-tight font-sans flex items-baseline transition-colors ${
                isDarkMode ? "text-zinc-100" : "text-slate-800"
              }`}>
                FinFlow
              </h2>
              <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest block -mt-1">
                Personal Manager
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? isDarkMode ? "bg-zinc-900 text-zinc-100 font-bold border border-zinc-800 shadow-sm" : "bg-blue-50 text-blue-600 font-bold"
                  : isDarkMode ? "text-zinc-400 hover:bg-zinc-900/40 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              Dashboard
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("transactions")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "transactions"
                  ? isDarkMode ? "bg-zinc-900 text-zinc-100 font-bold border border-zinc-800 shadow-sm" : "bg-blue-50 text-blue-600 font-bold"
                  : isDarkMode ? "text-zinc-400 hover:bg-zinc-900/40 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <ArrowRightLeft className="w-4.5 h-4.5" />
              Transactions
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("budgets")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "budgets"
                  ? isDarkMode ? "bg-zinc-900 text-zinc-100 font-bold border border-zinc-800 shadow-sm" : "bg-blue-50 text-blue-600 font-bold"
                  : isDarkMode ? "text-zinc-400 hover:bg-zinc-900/40 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Percent className="w-4.5 h-4.5" />
              Budgets
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "reports"
                  ? isDarkMode ? "bg-zinc-900 text-zinc-100 font-bold border border-zinc-800 shadow-sm" : "bg-blue-50 text-blue-600 font-bold"
                  : isDarkMode ? "text-zinc-400 hover:bg-zinc-900/40 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <PieIcon className="w-4.5 h-4.5" />
              Reports
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === "settings"
                  ? isDarkMode ? "bg-zinc-900 text-zinc-100 font-bold border border-zinc-800 shadow-sm" : "bg-blue-50 text-blue-600 font-bold"
                  : isDarkMode ? "text-zinc-400 hover:bg-zinc-900/40 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Sliders className="w-4.5 h-4.5" />
              Settings
            </motion.button>
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className={`p-6 border-t transition-all duration-300 ${
          isDarkMode ? "border-zinc-800 bg-zinc-950/40" : "border-slate-50 bg-slate-50/40"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs select-none ${
              isDarkMode ? "bg-zinc-800 text-zinc-100 border border-zinc-700" : "bg-blue-600 text-white"
            }`}>
              {userEmail.substring(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold truncate transition-colors ${
                isDarkMode ? "text-zinc-200" : "text-slate-700"
              }`} title={userEmail}>
                {userEmail}
              </p>
              <p className="text-[10px] font-medium text-zinc-400">Owner User</p>
            </div>
          </div>

          <div className={`mt-4 pt-4 border-t ${
            isDarkMode ? "border-zinc-800" : "border-slate-200/50"
          }`}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogout}
              className={`w-full py-2 px-3 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isDarkMode 
                  ? "bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800" 
                  : "bg-red-50 hover:bg-red-100 text-red-600"
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </motion.button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Stage */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Panel - Matching Image 3 navbar */}
        <header className={`h-16 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-all duration-300 ${
          isDarkMode ? "bg-[#09090b] border-b border-zinc-900" : "bg-white border-b border-slate-100"
        }`}>
          <div className="flex items-center gap-4">
            {/* Horizontal Tabs - Secondary Navigation representing top bar in Image 3 */}
            <div className="hidden lg:flex items-center gap-1">
              {(["dashboard", "transactions", "budgets", "reports", "settings"] as TabType[]).map((tab) => (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? isDarkMode ? "bg-zinc-900 text-white border border-zinc-800 shadow-xs" : "bg-slate-100 text-slate-800"
                      : isDarkMode ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3.5 flex-1 max-w-md justify-end md:justify-between lg:justify-end ml-auto">
            {/* Global Search Bar */}
            <div className="relative hidden md:block w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search or jump to... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-full py-1.5 pl-9 pr-4 text-xs font-medium focus:outline-none transition-all ${
                  isDarkMode 
                    ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:bg-black focus:border-zinc-700" 
                    : "bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-500"
                }`}
                onFocus={() => {
                  if (activeTab !== "transactions") {
                    setActiveTab("transactions");
                  }
                }}
              />
            </div>

            {/* Local Theme Selector */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleDarkMode}
              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                isDarkMode 
                  ? "bg-zinc-900 hover:bg-zinc-800 text-yellow-400 border-zinc-800" 
                  : "bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200"
              }`}
              title={isDarkMode ? "Toggle Light Mode" : "Toggle Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-full transition-colors relative cursor-pointer ${
                  isDarkMode ? "text-zinc-300 hover:text-white hover:bg-zinc-900" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
                )}
              </motion.button>

              {showNotifications && (
                <div className={`absolute right-0 mt-2.5 w-80 rounded-2xl shadow-2xl py-3 z-50 text-xs font-sans border ${
                  isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-slate-100 text-slate-600"
                }`}>
                  <div className={`px-4 pb-2 border-b flex justify-between items-center font-bold ${
                    isDarkMode ? "border-zinc-800 text-zinc-200" : "border-slate-100 text-slate-700"
                  }`}>
                    <span>Notifications</span>
                    <button 
                      onClick={() => setNotifications([])} 
                      className={`text-[10px] cursor-pointer ${isDarkMode ? "text-zinc-400 hover:text-zinc-100 hover:underline" : "text-blue-500 hover:underline"}`}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto pt-2">
                    {notifications.length === 0 ? (
                      <p className="text-zinc-500 text-center py-4">No new updates.</p>
                    ) : (
                      notifications.map((n, i) => (
                        <div key={i} className={`px-4 py-2.5 border-b text-xs last:border-0 ${
                          isDarkMode 
                            ? "hover:bg-zinc-800/40 border-zinc-800/50 text-zinc-300" 
                            : "hover:bg-slate-50 border-slate-50/50 text-slate-600"
                        }`}>
                          {n}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Image with dropdown */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1 focus:outline-none cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all shadow-xs ${
                  isDarkMode ? "border-zinc-800 hover:border-zinc-500" : "border-blue-500/30 hover:border-blue-500"
                }`}>
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-3 w-64 rounded-2xl shadow-2xl p-4 border z-50 text-xs font-sans ${
                      isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-100" : "bg-white border-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200/40 dark:border-zinc-800">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        isDarkMode ? "bg-zinc-800 text-zinc-100 border border-zinc-750" : "bg-blue-600 text-white"
                      }`}>
                        {userEmail.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs truncate" title={userEmail}>Owner</p>
                        <p className="text-[10px] text-zinc-400 truncate">{userEmail}</p>
                      </div>
                    </div>
                    <div className="py-2.5 space-y-1.5 border-b border-slate-200/40 dark:border-zinc-800">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500 uppercase">Tier</span>
                        <span className="text-emerald-500 font-bold">VERIFIED OWNERSHIP</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-zinc-500 uppercase">Auth Mode</span>
                        <span className={`font-bold ${isDarkMode ? "text-zinc-300" : "text-blue-500"}`}>OTP + PASS</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* 3. Render Dashboard or Specific Tabs */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading ? (
            <div className="py-24 text-center font-sans text-sm text-slate-400 flex flex-col items-center justify-center gap-3 h-full">
              <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 animate-spin rounded-full" />
              <span>Updating secure FinFlow database ledger...</span>
            </div>
          ) : error ? (
            <div className="p-6 max-w-lg mx-auto bg-white border border-red-100 rounded-2xl text-center space-y-4 shadow-sm mt-12">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-md">Network Desync Detected</h3>
              <p className="text-xs text-slate-500">{error}</p>
              <button
                onClick={fetchBudgetData}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Retry Profile Sync
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* --- TAB A: DASHBOARD VIEW (IMAGE 3 EXACT WIDGETS) --- */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  
                  {/* Dashboard Welcome Header */}
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Welcome back, {userEmail}! Let's monitor your finances.</p>
                  </div>

                  {/* ROW 1: STATS AND BUTTON CARDS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Stat Card 1: Total Balance */}
                    <div className={`lg:col-span-4 rounded-2xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${
                      isDarkMode ? "bg-zinc-900/40 border border-zinc-850 text-zinc-100" : "bg-white border border-slate-100 text-slate-800"
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                            Total Balance
                          </span>
                          <span className={`text-3xl font-extrabold tracking-tight block mt-2.5 ${
                            isDarkMode ? "text-zinc-100" : "text-slate-800"
                          }`}>
                            ${(totalIncome - totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className={`p-2.5 rounded-full ${
                          isDarkMode ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-blue-50 text-blue-500"
                        }`}>
                          <DollarSign className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
                          isDarkMode ? "bg-emerald-950/45 text-emerald-400 border border-emerald-900/20" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          ↗ Trend
                        </span>
                        <span className="text-[11px] text-zinc-500 font-medium">Accumulating value securely</span>
                      </div>
                    </div>

                    {/* Stat Card 2: Budget Health Score */}
                    <div className={`lg:col-span-4 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-all ${
                      isDarkMode ? "bg-zinc-900/40 border border-zinc-850 text-zinc-100" : "bg-white border border-slate-100 text-slate-800"
                    }`}>
                      <div className="flex items-center gap-4">
                        {/* Circular Progress Ring */}
                        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              className={isDarkMode ? "stroke-zinc-800" : "stroke-slate-100"}
                              strokeWidth="5"
                              fill="transparent"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="26"
                              className="stroke-emerald-500 transition-all duration-1000"
                              strokeWidth="5"
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 26}`}
                              strokeDashoffset={`${2 * Math.PI * 26 * (1 - budgetHealthScore / 100)}`}
                            />
                          </svg>
                          <div className={`absolute inset-0 flex items-center justify-center ${
                            isDarkMode ? "text-emerald-400" : "text-blue-600"
                          }`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block">
                            Budget Health Score
                          </span>
                          <span className={`text-lg font-extrabold mt-0.5 flex items-center gap-1.5 ${
                            isDarkMode ? "text-zinc-100" : "text-slate-800"
                          }`}>
                            {budgetHealthScore}/100 
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                              isDarkMode ? "bg-emerald-950/45 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                            }`}>
                              (Good)
                            </span>
                          </span>
                        </div>
                      </div>
                      <p className="text-[11.5px] text-zinc-400 leading-relaxed font-medium mt-3">
                        Excellent budget health. You have managed your expenses perfectly within target thresholds this month!
                      </p>
                    </div>

                    {/* Stat Card 3: Quick Add Expense Button */}
                    <div className={`lg:col-span-4 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-all relative ${
                      isDarkMode ? "bg-zinc-900/40 border border-zinc-850 text-zinc-100" : "bg-white border border-slate-100"
                    }`}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setTxType("expense");
                          setIsTxModalOpen(true);
                        }}
                        className={`w-full py-3 px-4 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                          isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700" : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <Plus className="w-5 h-5" />
                        Quick Add Expense
                      </motion.button>
                      <p className="text-[11px] text-zinc-500 font-medium mt-3">
                        Press <kbd className={`px-1.5 py-0.5 rounded font-mono text-[9px] shadow-xs ${
                          isDarkMode ? "bg-zinc-800 border border-zinc-700 text-zinc-300" : "bg-slate-100 border-slate-200 text-slate-600"
                        }`}>Ctrl+E</kbd> anywhere to trigger
                      </p>
                    </div>

                  </div>

                  {/* ROW 2: CHART AND BUDGET PROGRESS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Chart Card: Income vs Expense */}
                    <div className={`lg:col-span-7 rounded-2xl p-6 shadow-sm flex flex-col justify-between ${
                      isDarkMode ? "bg-zinc-900/40 border border-zinc-850 text-zinc-100" : "bg-white border border-slate-100 text-slate-800"
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Monthly Income vs Expense</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Visual cash flow comparison</p>
                        </div>
                        <select className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600 font-medium focus:outline-none">
                          <option>June 2024</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 items-center">
                        {/* Chart Render */}
                        <div className="md:col-span-7 h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: "June 2024", Income: totalIncome, Expense: totalExpenses }
                              ]}
                              barGap={10}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} />
                              <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} />
                              <Tooltip cursor={{ fill: "#f8fafc" }} />
                              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                              <Bar dataKey="Expense" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Chart Insights Panel */}
                        <div className="md:col-span-5 space-y-4 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Key Insight</span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                              <span className="text-xs font-semibold text-slate-700">Income: ${totalIncome.toLocaleString()}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Key Insight</span>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                              <span className="text-xs font-semibold text-slate-700">Expense: ${totalExpenses.toLocaleString()}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Budget Left</span>
                            <span className="text-lg font-bold text-slate-800 block mt-1">
                              ${(totalIncome - totalExpenses).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Card: Budget Progress */}
                    <div className="lg:col-span-5 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col">
                      <div className="flex justify-between items-center mb-5">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Budget Progress</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Actual spent vs limit</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-4 flex-1">
                        {budgetProgressList.length === 0 ? (
                          <div className="h-full flex flex-col justify-center items-center py-8 text-center text-slate-400">
                            <AlertTriangle className="w-6 h-6 text-slate-300 mb-1" />
                            <p className="text-xs">No active budgets initialized.</p>
                            <button
                              onClick={() => setActiveTab("budgets")}
                              className="text-xs text-blue-500 underline font-semibold mt-1"
                            >
                              Initialize Budgets
                            </button>
                          </div>
                        ) : (
                          budgetProgressList.slice(0, 4).map((b, i) => {
                            const isOver = b.percent > 100;
                            return (
                              <div key={i} className="space-y-1.5">
                                <div className="flex justify-between items-baseline text-xs font-semibold text-slate-700">
                                  <span>{b.category} ({b.percent.toFixed(0)}% Used)</span>
                                  <span className="text-[11px] text-slate-500">
                                    -${b.spent.toFixed(0)} / ${b.limit.toFixed(0)}
                                  </span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      isOver ? "bg-red-500" : getCategoryColorClass(b.category)
                                    }`}
                                    style={{ width: `${Math.min(100, b.percent)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>

                  {/* ROW 3: TRANSACTIONS, BILLS, GOALS */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Recent Transactions Card */}
                    <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col">
                      <div className="flex justify-between items-baseline mb-4">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Recent Transactions</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Latest ledger updates</p>
                        </div>
                        <button
                          onClick={() => setActiveTab("transactions")}
                          className="text-xs text-blue-500 font-semibold hover:underline"
                        >
                          View All
                        </button>
                      </div>

                      <div className="space-y-3.5 flex-1">
                        {transactions.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">No transactions recorded yet.</div>
                        ) : (
                          transactions.slice(-4).reverse().map((tx) => {
                            const isExpense = tx.type === "expense";
                            
                            // Assign nice icons for branding
                            const getTxBrandIcon = (desc: string) => {
                              const d = desc.toLowerCase();
                              if (d.includes("starbucks")) return <span className="text-emerald-600 font-black font-serif">S</span>;
                              if (d.includes("amazon")) return <span className="text-yellow-600 font-bold font-sans">a</span>;
                              if (d.includes("trader")) return <span className="text-red-600 font-bold font-sans">TJ</span>;
                              if (d.includes("netflix")) return <span className="text-red-700 font-black font-sans">N</span>;
                              return isExpense ? <ArrowDownLeft className="w-3.5 h-3.5 text-red-500" /> : <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />;
                            };

                            const getTxBrandBg = (desc: string) => {
                              const d = desc.toLowerCase();
                              if (d.includes("starbucks")) return "bg-emerald-50";
                              if (d.includes("amazon")) return "bg-amber-50";
                              if (d.includes("trader")) return "bg-red-50";
                              if (d.includes("netflix")) return "bg-slate-900";
                              return isExpense ? "bg-red-50" : "bg-emerald-50";
                            };

                            return (
                              <div key={tx.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold ${getTxBrandBg(tx.description)}`}>
                                    {getTxBrandIcon(tx.description)}
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-800 truncate">{tx.description}</h4>
                                    <p className="text-[10px] font-medium text-slate-400 mt-0.5 capitalize">{tx.category}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs font-bold ${isExpense ? "text-slate-800" : "text-emerald-500"}`}>
                                    {isExpense ? "-" : "+"}${tx.amount.toFixed(2)}
                                  </span>
                                  <p className="text-[9px] font-mono text-slate-400 mt-0.5">{tx.date}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Upcoming Bills Card */}
                    <div className={`lg:col-span-4 rounded-2xl p-6 shadow-sm flex flex-col ${
                      isDarkMode ? "bg-zinc-900/40 border border-zinc-850 text-zinc-100" : "bg-white border border-slate-100"
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className={`font-bold text-sm ${isDarkMode ? "text-zinc-100" : "text-slate-800"}`}>Upcoming Bills</h3>
                          <p className="text-[11px] text-zinc-500 font-medium">Avoid late payment penalties</p>
                        </div>
                        <span className={`p-1.5 rounded-full ${isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-slate-50 text-slate-400"}`}>
                          <Bell className="w-4 h-4" />
                        </span>
                      </div>

                      <div className="space-y-4.5 flex-1">
                        {/* Bill 1: Electric Bill */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              isDarkMode ? "bg-amber-950/40 text-amber-400 border border-amber-900/20" : "bg-amber-50 text-amber-500"
                            }`}>
                              <Zap className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h4 className={`text-xs font-bold ${isDarkMode ? "text-zinc-200" : "text-slate-800"}`}>Electric Bill</h4>
                              <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Due June 20</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isDarkMode ? "text-zinc-100" : "text-slate-800"}`}>- $110.00</span>
                            <div className="flex items-center gap-1.5">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleReminder("Electric Bill")}
                                className={`p-1.5 rounded-lg border text-xs cursor-pointer flex items-center justify-center transition-colors ${
                                  reminders["Electric Bill"]
                                    ? "bg-amber-500 text-white border-amber-500"
                                    : isDarkMode
                                      ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white"
                                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                                title={reminders["Electric Bill"] ? "Reminder active!" : "Set due date reminder"}
                              >
                                <Bell className={`w-3.5 h-3.5 ${reminders["Electric Bill"] ? "animate-bounce" : ""}`} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePayBill("Electric Bill", 110.0)}
                                className={`text-[10px] font-semibold px-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                                  isDarkMode
                                    ? "text-zinc-200 bg-zinc-800 border-zinc-700 hover:bg-zinc-750"
                                    : "text-blue-600 hover:bg-blue-50 bg-blue-50/40 border-blue-100"
                                }`}
                              >
                                Pay
                              </motion.button>
                            </div>
                          </div>
                        </div>

                        {/* Bill 2: Internet Bill */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              isDarkMode ? "bg-zinc-850 text-zinc-300 border border-zinc-750" : "bg-blue-50 text-blue-500"
                            }`}>
                              <Wifi className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h4 className={`text-xs font-bold ${isDarkMode ? "text-zinc-200" : "text-slate-800"}`}>Internet Subscription</h4>
                              <p className="text-[10px] font-medium text-zinc-500 mt-0.5">Due June 25</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isDarkMode ? "text-zinc-100" : "text-slate-800"}`}>- $65.00</span>
                            <div className="flex items-center gap-1.5">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => toggleReminder("Internet Subscription")}
                                className={`p-1.5 rounded-lg border text-xs cursor-pointer flex items-center justify-center transition-colors ${
                                  reminders["Internet Subscription"]
                                    ? "bg-amber-500 text-white border-amber-500"
                                    : isDarkMode
                                      ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750 hover:text-white"
                                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                                }`}
                                title={reminders["Internet Subscription"] ? "Reminder active!" : "Set due date reminder"}
                              >
                                <Bell className={`w-3.5 h-3.5 ${reminders["Internet Subscription"] ? "animate-bounce" : ""}`} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handlePayBill("Internet Subscription", 65.0)}
                                className={`text-[10px] font-semibold px-2 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                                  isDarkMode
                                    ? "text-zinc-200 bg-zinc-800 border-zinc-700 hover:bg-zinc-750"
                                    : "text-blue-600 hover:bg-blue-50 bg-blue-50/40 border-blue-100"
                                }`}
                              >
                                Pay
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Savings Goals Card */}
                    <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Savings Goals</h3>
                          <p className="text-[11px] text-slate-400 font-medium">Accumulating reserves</p>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      {savingsGoals.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 flex flex-col justify-center items-center flex-1">
                          <p>No savings goals registered.</p>
                          <button
                            onClick={() => setActiveTab("settings")}
                            className="text-xs text-blue-500 font-semibold underline mt-1"
                          >
                            Add Savings Goal
                          </button>
                        </div>
                      ) : (
                        savingsGoals.slice(0, 1).map((g) => {
                          const percent = g.target > 0 ? (g.current / g.target) * 100 : 0;
                          return (
                            <div key={g.id} className="space-y-4 flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-baseline text-xs font-semibold text-slate-700">
                                  <span>{g.name} ({percent.toFixed(0)}% saved)</span>
                                  <span className="text-[11px] text-slate-500">
                                    ${g.current.toLocaleString()} / ${g.target.toLocaleString()}
                                  </span>
                                </div>

                                {/* Area Chart visualization representation of wave */}
                                <div className="h-24 mt-3">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={savingTrendData}>
                                      <defs>
                                        <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <Tooltip cursor={false} />
                                      <Area
                                        type="monotone"
                                        dataKey="savings"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorSavings)"
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[11px] font-semibold border-t border-slate-50 pt-3">
                                <span className="text-emerald-500">Saving Trend: +$500 last month</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedGoalId(g.id);
                                      setContribType("deposit");
                                      setContribAmount("");
                                    }}
                                    className="text-blue-600 hover:underline cursor-pointer"
                                  >
                                    + Add
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedGoalId(g.id);
                                      setContribType("withdraw");
                                      setContribAmount("");
                                    }}
                                    className="text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                                  >
                                    - Draw
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>

                </div>
              )}

              {/* --- TAB B: FULL TRANSACTIONS LEDGER --- */}
              {activeTab === "transactions" && (() => {
                const exportIncome = filteredTransactions.filter(t => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
                const exportExpense = filteredTransactions.filter(t => t.type === "expense").reduce((acc, t) => acc + t.amount, 0);
                const exportBalance = exportIncome - exportExpense;

                return (
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* LEFT MAIN COLUMN: Ledger Table */}
                    <div className={`xl:col-span-2 border p-6 rounded-3xl shadow-xs space-y-6 transition-all duration-300 ${
                      isDarkMode ? "bg-[#0f172a] border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"
                    }`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h2 className={`text-xl font-bold tracking-tight transition-colors ${
                            isDarkMode ? "text-white" : "text-slate-800"
                          }`}>
                            Ledger transactions
                          </h2>
                          <p className="text-xs text-slate-400 font-medium">Add, review, and search your transactions</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTxType("income");
                              setIsTxModalOpen(true);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isDarkMode 
                                ? "bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/20" 
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            Deposit Income
                          </button>
                          <button
                            onClick={() => {
                              setTxType("expense");
                              setIsTxModalOpen(true);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isDarkMode 
                                ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700" 
                                : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            Record Expense
                          </button>
                        </div>
                      </div>

                      {/* Filters Toolbar */}
                      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl border transition-colors ${
                        isDarkMode ? "bg-[#0b101c] border-slate-800" : "bg-slate-50/50 border-slate-100"
                      }`}>
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full border rounded-xl py-1.5 pl-9 pr-4 text-xs font-medium focus:outline-none transition-colors ${
                              isDarkMode 
                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-900 focus:border-blue-500" 
                                : "bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-blue-500"
                            }`}
                          />
                        </div>

                        <div>
                          <select
                            value={typeFilter}
                            onChange={(e: any) => setTypeFilter(e.target.value)}
                            className={`w-full border rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none cursor-pointer transition-colors ${
                              isDarkMode 
                                ? "bg-slate-800 border-slate-700 text-slate-200 focus:bg-slate-900" 
                                : "bg-white border-slate-200 text-slate-600 focus:border-blue-500"
                            }`}
                          >
                            <option value="all">All Types</option>
                            <option value="income">Income Only</option>
                            <option value="expense">Expenses Only</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className={`w-full border rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none cursor-pointer transition-colors ${
                              isDarkMode 
                                ? "bg-slate-800 border-slate-700 text-slate-200 focus:bg-slate-900" 
                                : "bg-white border-slate-200 text-slate-600 focus:border-blue-500"
                            }`}
                          >
                            <option value="all">All Categories</option>
                            {uniqueCategories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-end">
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                            {filteredTransactions.length} Record(s) Found
                          </span>
                        </div>
                      </div>

                      {/* Ledger Table */}
                      <div className={`border rounded-2xl overflow-hidden transition-colors ${
                        isDarkMode ? "border-slate-800 bg-[#0e1626]" : "border-slate-100 bg-white"
                      }`}>
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`border-b text-[11px] font-bold uppercase tracking-wider transition-colors ${
                              isDarkMode ? "bg-slate-800/50 border-slate-700 text-slate-400" : "bg-slate-50/50 border-slate-100 text-slate-400"
                            }`}>
                              <th className="py-3.5 px-4">Date</th>
                              <th className="py-3.5 px-4">Description</th>
                              <th className="py-3.5 px-4">Category</th>
                              <th className="py-3.5 px-4">Type</th>
                              <th className="py-3.5 px-4 text-right">Amount</th>
                              <th className="py-3.5 px-4 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y text-xs font-semibold transition-colors ${
                            isDarkMode ? "divide-slate-800/80 text-slate-300" : "divide-slate-100 text-slate-600"
                          }`}>
                            {filteredTransactions.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                  No matching transactions found.
                                </td>
                              </tr>
                            ) : (
                              filteredTransactions.slice().reverse().map((tx) => {
                                const isExpense = tx.type === "expense";
                                return (
                                  <tr key={tx.id} className={`transition-all duration-150 ${
                                    isDarkMode ? "hover:bg-slate-800/40" : "hover:bg-slate-50/45"
                                  }`}>
                                    <td className="py-3.5 px-4 font-mono text-slate-400 dark:text-slate-500">{tx.date}</td>
                                    <td className={`py-3.5 px-4 font-bold ${
                                      isDarkMode ? "text-white" : "text-slate-800"
                                    }`}>{tx.description}</td>
                                    <td className="py-3.5 px-4">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${getCategoryTextClass(tx.category)} bg-slate-100/10`}>
                                        {tx.category}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        isExpense 
                                          ? isDarkMode ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-600" 
                                          : isDarkMode ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/20" : "bg-emerald-50 text-emerald-600"
                                      }`}>
                                        {tx.type}
                                      </span>
                                    </td>
                                    <td className={`py-3.5 px-4 text-right font-bold text-sm ${
                                      isExpense 
                                        ? isDarkMode ? "text-slate-100" : "text-slate-800" 
                                        : "text-emerald-500 dark:text-emerald-400"
                                    }`}>
                                      {isExpense ? "-" : "+"}${tx.amount.toFixed(2)}
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                      <button
                                        onClick={() => handleDeleteTransaction(tx.id)}
                                        className="p-1.5 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                                        title="Purge transaction record"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Report Export Engine (Satisfies the new requested layout column) */}
                    <div className="space-y-6">
                      <div className={`border p-6 rounded-3xl shadow-xs transition-all duration-300 ${
                        isDarkMode ? "bg-[#0f172a] border-slate-800 text-slate-100" : "bg-white border-slate-100 text-slate-800"
                      }`}>
                        <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                            <Download className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className={`text-md font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                              Statement Export Engine
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Report generation center</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                          Configure filters on the left, then trigger a certified transaction audit report or a spreadsheet-ready Excel ledger.
                        </p>

                        {/* Statement Metrics */}
                        <div className="space-y-3.5 mb-6">
                          <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
                            isDarkMode ? "bg-slate-800/40" : "bg-slate-50"
                          }`}>
                            <span className="text-slate-400">Ledger Count</span>
                            <span className="font-mono font-bold">{filteredTransactions.length} transaction(s)</span>
                          </div>
                          
                          <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
                            isDarkMode ? "bg-slate-800/40" : "bg-slate-50"
                          }`}>
                            <span className="text-slate-400">Filtered Deposits</span>
                            <span className="font-mono font-bold text-emerald-500">+${exportIncome.toFixed(2)}</span>
                          </div>

                          <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
                            isDarkMode ? "bg-slate-800/40" : "bg-slate-50"
                          }`}>
                            <span className="text-slate-400">Filtered Expenses</span>
                            <span className="font-mono font-bold text-red-500">-${exportExpense.toFixed(2)}</span>
                          </div>

                          <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
                            isDarkMode ? "bg-slate-800/40" : "bg-slate-50"
                          }`}>
                            <span className="text-slate-400">Net Flow Balance</span>
                            <span className={`font-mono font-bold ${exportBalance >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {exportBalance >= 0 ? "+" : ""}${exportBalance.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5">
                          <button
                            onClick={handleExportCSV}
                            disabled={filteredTransactions.length === 0}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                          >
                            <FileSpreadsheet className="w-4.5 h-4.5" />
                            Export Excel (CSV)
                          </button>

                          <button
                            onClick={handleExportPDF}
                            disabled={filteredTransactions.length === 0}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-40"
                          >
                            <FileText className="w-4.5 h-4.5" />
                            Generate Statement (PDF)
                          </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center font-semibold uppercase tracking-wider">
                          🔒 Secure Certified Audit
                        </div>
                      </div>

                      {/* Informational Guidelines widget inside sidebar column */}
                      <div className={`border p-4.5 rounded-2xl transition-colors ${
                        isDarkMode ? "bg-slate-800/20 border-slate-800 text-slate-400" : "bg-blue-50/30 border-blue-100/50 text-slate-500"
                      }`}>
                        <h4 className={`text-xs font-bold mb-1 ${isDarkMode ? "text-white" : "text-blue-800"}`}>Pro Statements Tips</h4>
                        <p className="text-[11px] leading-relaxed font-medium">
                          You can type categories or descriptions inside search fields on the left table, select any Type filters, and generate customized, real-time PDF statements.
                        </p>
                      </div>
                    </div>

                    {/* PRINT-ONLY BANK STATEMENT VIEW */}
                    <div className="print-only p-8 font-sans bg-white text-black min-h-screen">
                      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                        <div>
                          <h1 className="text-2xl font-bold tracking-tight uppercase">FINFLOW CERTIFIED STATEMENT</h1>
                          <p className="text-xs text-gray-500">Official Account Ledger Report</p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-bold">Date Created: {new Date().toLocaleDateString()}</p>
                          <p>Account Owner: {userEmail}</p>
                          <p>Verification Tier: OTP + PASSWORD SECURE</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 p-4 border border-black rounded-lg mb-6">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Deposits</p>
                          <p className="text-lg font-bold text-green-700">${exportIncome.toFixed(2)}</p>
                        </div>
                        <div className="text-center border-x border-black">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Outflows</p>
                          <p className="text-lg font-bold text-red-700">${exportExpense.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Net Cashflow</p>
                          <p className="text-lg font-bold text-black">${exportBalance.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="text-xs font-bold mb-2">RECORDED TRANSACTIONS LEDGER ({filteredTransactions.length} Items)</div>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-black font-bold bg-gray-100">
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3">Type</th>
                            <th className="py-2 px-3 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredTransactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="py-2 px-3 font-mono">{tx.date}</td>
                              <td className="py-2 px-3 font-semibold">{tx.description}</td>
                              <td className="py-2 px-3">{tx.category}</td>
                              <td className="py-2 px-3 uppercase font-bold">{tx.type}</td>
                              <td className="py-2 px-3 text-right font-semibold">
                                {tx.type === "expense" ? "-" : "+"}${tx.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-12 text-[10px] text-center text-gray-400 border-t pt-4">
                        This statement represents a true and certified local transaction audit for user account {userEmail}. 
                        All records are cryptographically matched and protected within FinFlow.
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* --- TAB C: BUDGET LIMIT CONTROLS --- */}
              {activeTab === "budgets" && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 tracking-tight">Category Threshold Budgets</h2>
                      <p className="text-xs text-slate-400 font-medium">Set limits per category to manage spending</p>
                    </div>

                    <button
                      onClick={() => setIsAddingBudget(!isAddingBudget)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {isAddingBudget ? "Hide Form" : "Add Budget Threshold"}
                    </button>
                  </div>

                  {/* Add Budget Form */}
                  {isAddingBudget && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newBudgetCategory || !newBudgetLimit) return;
                        await handleUpdateBudget(newBudgetCategory, newBudgetLimit);
                        setNewBudgetCategory("");
                        setNewBudgetLimit("");
                        setIsAddingBudget(false);
                      }}
                      className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Category</label>
                        <select
                          value={newBudgetCategory}
                          onChange={(e) => setNewBudgetCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700"
                          required
                        >
                          <option value="">Select category...</option>
                          {defaultCategories.filter(c => c !== "Custom").map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Monthly Limit ($)</label>
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          value={newBudgetLimit}
                          onChange={(e) => setNewBudgetLimit(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-700"
                          required
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Initialize Limit
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Budgets Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {budgetProgressList.map((b) => {
                      const isOver = b.percent > 100;
                      return (
                        <div key={b.category} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 shadow-xs hover:shadow-md transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">{b.category}</h3>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Threshold Limit</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              isOver ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                            }`}>
                              {isOver ? "ALERT EXCEEDED" : "HEALTHY"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                              <span>{b.percent.toFixed(0)}% Spent</span>
                              <span>${b.spent.toFixed(2)} / ${b.limit.toFixed(2)}</span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full w-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOver ? "bg-red-500" : getCategoryColorClass(b.category)
                                }`}
                                style={{ width: `${Math.min(100, b.percent)}%` }}
                              />
                            </div>
                          </div>

                          {editingCategory === b.category ? (
                            <div className="flex gap-1.5 pt-2">
                              <input
                                type="number"
                                placeholder="New limit"
                                value={editingLimitValue}
                                onChange={(e) => setEditingLimitValue(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-200 p-1.5 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                              />
                              <button
                                onClick={() => handleUpdateBudget(b.category, editingLimitValue)}
                                className="px-3 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCategory(null)}
                                className="p-1.5 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCategory(b.category);
                                setEditingLimitValue(b.limit.toString());
                              }}
                              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all uppercase tracking-wider"
                            >
                              Edit Budget Limit
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* --- TAB D: REPORTS ANALYTICS --- */}
              {activeTab === "reports" && (
                <div className="space-y-6">
                  
                  {/* Reports Headers */}
                  <div>
                    <h1 className="text-xl font-bold text-slate-800 tracking-tight">Financial Reports</h1>
                    <p className="text-xs text-slate-400 font-medium">Deep-dive category analytical distributions</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Expense Category Distribution (Pie Chart) */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Consolidated Expense Breakdown</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Total spending by category</p>
                      </div>

                      {totalExpenses === 0 ? (
                        <div className="h-60 flex items-center justify-center text-slate-400 text-xs">
                          No expense records available to visualize breakdown.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          <div className="md:col-span-6 h-56">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={budgetProgressList.map(b => ({ name: b.category, value: b.spent }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={45}
                                  outerRadius={75}
                                  paddingAngle={3}
                                  dataKey="value"
                                >
                                  {budgetProgressList.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={
                                        entry.category.toLowerCase().includes("food") ? "#10b981" :
                                        entry.category.toLowerCase().includes("rent") ? "#3b82f6" :
                                        entry.category.toLowerCase().includes("transport") ? "#f97316" :
                                        entry.category.toLowerCase().includes("entertainment") ? "#f59e0b" :
                                        "#8b5cf6"
                                      }
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#f1f5f9", borderRadius: "12px" }}
                                  formatter={(val: any) => [`$${parseFloat(val).toFixed(2)}`, "Spent"]}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="md:col-span-6 space-y-2.5">
                            {budgetProgressList.map((entry, i) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-2 font-medium text-slate-600">
                                  <span className={`w-2.5 h-2.5 rounded-full ${
                                    entry.category.toLowerCase().includes("food") ? "bg-emerald-500" :
                                    entry.category.toLowerCase().includes("rent") ? "bg-blue-500" :
                                    entry.category.toLowerCase().includes("transport") ? "bg-orange-500" :
                                    entry.category.toLowerCase().includes("entertainment") ? "bg-amber-500" :
                                    "bg-purple-500"
                                  }`} />
                                  <span>{entry.category}</span>
                                </div>
                                <span className="font-bold text-slate-800">${entry.spent.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Historical Cash Flow Trend (Area Chart) */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Monthly Revenue vs Spending</h3>
                        <p className="text-[11px] text-slate-400 font-medium">Accumulating financial growth projection</p>
                      </div>

                      <div className="h-60">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[
                              { month: "Jan", Income: totalIncome * 0.8, Expense: totalExpenses * 0.7 },
                              { month: "Feb", Income: totalIncome * 0.9, Expense: totalExpenses * 0.8 },
                              { month: "Mar", Income: totalIncome * 1.1, Expense: totalExpenses * 0.95 },
                              { month: "Apr", Income: totalIncome * 1.0, Expense: totalExpenses * 0.9 },
                              { month: "May", Income: totalIncome * 0.95, Expense: totalExpenses * 0.85 },
                              { month: "Jun", Income: totalIncome, Expense: totalExpenses }
                            ]}
                          >
                            <defs>
                              <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                            <Tooltip />
                            <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorInc)" />
                            <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* --- TAB E: PROFILE & SETTINGS CONTROLS --- */}
              {activeTab === "settings" && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 max-w-4xl">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">FinFlow Portal Settings</h2>
                    <p className="text-xs text-slate-400 font-medium">Manage profile accounts, database savings goals, and sandbox variables</p>
                  </div>

                  <div className="pt-2">
                    {/* User Profile Summary */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 max-w-xl">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Profile Identity</h3>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg select-none">
                          {userEmail.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{userEmail}</p>
                          <p className="text-xs text-slate-500 font-semibold mt-0.5">Account Status: Verified Authorized</p>
                          <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Secure Session Active
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add Savings Goal form inside Settings */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Durable Savings Goals</h3>
                        <p className="text-xs text-slate-400 font-medium">Add long term accumulation plans</p>
                      </div>
                      <button
                        onClick={() => setIsAddingGoal(!isAddingGoal)}
                        className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                      >
                        {isAddingGoal ? "Cancel" : "Add Goal"}
                      </button>
                    </div>

                    {isAddingGoal && (
                      <form onSubmit={handleAddSavingsGoal} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Goal Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Emergency Fund"
                              value={goalName}
                              onChange={(e) => setGoalName(e.target.value)}
                              className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Target Amount ($)</label>
                            <input
                              type="number"
                              placeholder="e.g. 10000"
                              value={goalTarget}
                              onChange={(e) => setGoalTarget(e.target.value)}
                              className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Initial Seed ($)</label>
                            <input
                              type="number"
                              placeholder="e.g. 1500"
                              value={goalCurrent}
                              onChange={(e) => setGoalCurrent(e.target.value)}
                              className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Deadline Date (Optional)</label>
                            <input
                              type="date"
                              value={goalDeadline}
                              onChange={(e) => setGoalDeadline(e.target.value)}
                              className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-semibold text-slate-700 font-mono"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          Initialize Savings Goal
                        </button>
                      </form>
                    )}

                    {/* Active goals inventory list */}
                    <div className="space-y-4">
                      {savingsGoals.map((g) => {
                        const percent = g.target > 0 ? (g.current / g.target) * 100 : 0;
                        const isCompleted = g.current >= g.target;
                        return (
                          <div key={g.id} className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex justify-between items-baseline text-xs font-bold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                  {g.name}
                                  {isCompleted && (
                                    <span className="text-[9px] font-mono bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-extrabold">
                                      Goal Achieved
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  ${g.current.toLocaleString()} / ${g.target.toLocaleString()} ({percent.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full w-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isCompleted ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
                                  }`}
                                  style={{ width: `${Math.min(100, percent)}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteGoal(g.id)}
                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all cursor-pointer"
                                title="Delete savings goal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </main>
      </div>

      {/* --- QUICK ADD TRANSACTION MODAL DIALOG --- */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {txType === "expense" ? "Add New Expense" : "Record Income"}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Enter transaction details below</p>
              </div>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Type Switcher Selector */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg text-center transition-all ${
                    txType === "expense" 
                      ? "bg-white text-slate-800 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg text-center transition-all ${
                    txType === "income" 
                      ? "bg-white text-slate-800 shadow-xs" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 12.50"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-600 focus:outline-none"
                  required
                >
                  {defaultCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {txCategory === "Custom" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Custom Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Subscriptions"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Merchant / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks Coffee"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Save Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- GOAL DEPOSIT / WITHDRAW MODAL DIALOG --- */}
      {selectedGoalId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="w-full max-w-sm bg-white border border-slate-100 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                  {contribType === "deposit" ? "Contribute to Goal" : "Draw from Goal"}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Move funds between accounts</p>
              </div>
              <button
                onClick={() => setSelectedGoalId(null)}
                className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGoalContribution} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Amount ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Confirm Transaction
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
