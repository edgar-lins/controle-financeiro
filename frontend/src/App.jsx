import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { HiChartBar, HiCreditCard, HiCash, HiTrendingDown, HiLogout, HiCurrencyDollar } from "react-icons/hi";
import { FaBullseye } from "react-icons/fa";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Incomes from "./Incomes";
import Accounts from "./Accounts";
import Goals from "./Goals";
import Login from "./Login";
import { SummaryProvider } from "./SummaryContext";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("token");
    const firstName = localStorage.getItem("firstName");
    if (stored) {
      setToken(stored);
      setUserName(firstName || "");
    }
  }, []);

  function handleLogin(newToken) {
    setToken(newToken);
    const firstName = localStorage.getItem("firstName");
    setUserName(firstName || "");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    setToken(null);
    setUserName("");
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <SummaryProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Navbar */}
          <nav className="bg-white/10 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <HiCurrencyDollar className="text-cyan-400 text-3xl" />
                    <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      FinControl
                    </span>
                  </div>
                </div>

                {/* Menu */}
                <div className="flex gap-8 items-center">
                  <NavLink className={({ isActive }) => `flex items-center gap-2 font-medium transition duration-200 pb-1 border-b-2 ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/">
                    <HiChartBar className="text-lg" />
                    <span>Resumo</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-2 font-medium transition duration-200 pb-1 border-b-2 ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/expenses">
                    <HiTrendingDown className="text-lg" />
                    <span>Gastos</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-2 font-medium transition duration-200 pb-1 border-b-2 ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/incomes">
                    <HiCash className="text-lg" />
                    <span>Rendas</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-2 font-medium transition duration-200 pb-1 border-b-2 ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/accounts">
                    <HiCreditCard className="text-lg" />
                    <span>Contas</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-2 font-medium transition duration-200 pb-1 border-b-2 ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/goals">
                    <FaBullseye className="text-lg" />
                    <span>Metas</span>
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                  >
                    <HiLogout />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Dashboard userName={userName} getGreeting={getGreeting} />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/incomes" element={<Incomes />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/goals" element={<Goals />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SummaryProvider>
  );
}
