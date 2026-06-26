import React, { useState } from "react";
import BudgetTracker from "./components/BudgetTracker";
import AuthPage from "./components/AuthPage";

export default function App() {
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(() => {
    return localStorage.getItem("finflow_verified_email") || null;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("finflow_theme") === "dark";
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("finflow_theme", next ? "dark" : "light");
      return next;
    });
  };

  const handleLoginSuccess = (email: string) => {
    setVerifiedEmail(email);
    localStorage.setItem("finflow_verified_email", email);
  };

  const handleLogout = () => {
    setVerifiedEmail(null);
    localStorage.removeItem("finflow_verified_email");
  };

  if (!verifiedEmail) {
    return (
      <AuthPage 
        onLoginSuccess={handleLoginSuccess} 
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none p-4 md:p-6 lg:p-8 transition-colors duration-300 ${
      isDarkMode ? "bg-[#090d16] text-slate-100" : "bg-slate-100/50 text-slate-800"
    }`}>
      <main className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center select-text">
        <BudgetTracker
          userEmail={verifiedEmail}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      </main>
    </div>
  );
}
