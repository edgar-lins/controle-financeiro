import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { HiChartBar, HiCreditCard, HiCash, HiTrendingDown, HiLogout, HiCurrencyDollar, HiCog, HiMenu, HiX } from "react-icons/hi";
import { FaBullseye } from "react-icons/fa";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Incomes from "./Incomes";
import Accounts from "./Accounts";
import Goals from "./Goals";
import Settings from "./Settings";
import Login from "./Login";
import { SummaryProvider } from "./SummaryContext";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
                  <HiCurrencyDollar className="text-cyan-400 text-2xl md:text-3xl" />
                  <span className="hidden sm:inline text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    FinControl
                  </span>
                </NavLink>

                {/* Menu Hamburguês - Mobile */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden text-white text-2xl"
                >
                  {mobileMenuOpen ? <HiX /> : <HiMenu />}
                </button>

                {/* Menu Desktop */}
                <div className="hidden md:flex gap-4 lg:gap-8 items-center">
                  <NavLink className={({ isActive }) => `flex items-center gap-1 lg:gap-2 font-medium transition duration-200 pb-1 border-b-2 text-sm lg:text-base ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/">
                    <HiChartBar className="text-lg" />
                    <span>Resumo</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-1 lg:gap-2 font-medium transition duration-200 pb-1 border-b-2 text-sm lg:text-base ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/expenses">
                    <HiTrendingDown className="text-lg" />
                    <span>Gastos</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-1 lg:gap-2 font-medium transition duration-200 pb-1 border-b-2 text-sm lg:text-base ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/incomes">
                    <HiCash className="text-lg" />
                    <span>Rendas</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-1 lg:gap-2 font-medium transition duration-200 pb-1 border-b-2 text-sm lg:text-base ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/accounts">
                    <HiCreditCard className="text-lg" />
                    <span>Contas</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-1 lg:gap-2 font-medium transition duration-200 pb-1 border-b-2 text-sm lg:text-base ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/goals">
                    <FaBullseye className="text-lg" />
                    <span>Metas</span>
                  </NavLink>
                  <NavLink className={({ isActive }) => `flex items-center gap-1 lg:gap-2 font-medium transition duration-200 pb-1 border-b-2 text-sm lg:text-base ${
                    isActive ? "text-cyan-400 border-cyan-400" : "text-gray-300 border-transparent hover:text-white hover:border-gray-600"
                  }`} to="/settings">
                    <HiCog className="text-lg" />
                    <span className="hidden lg:inline">Configurações</span>
                  </NavLink>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-medium transition duration-200"
                  >
                    <HiLogout />
                    <span className="hidden lg:inline">Sair</span>
                  </button>
                </div>
              </div>

              {/* Menu Mobile */}
              {mobileMenuOpen && (
                <div className="md:hidden pb-4 space-y-2">
                  <NavLink onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded font-medium transition ${
                    isActive ? "bg-cyan-400/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
                  }`} to="/">
                    <HiChartBar className="inline mr-2" /> Resumo
                  </NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded font-medium transition ${
                    isActive ? "bg-cyan-400/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
                  }`} to="/expenses">
                    <HiTrendingDown className="inline mr-2" /> Gastos
                  </NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded font-medium transition ${
                    isActive ? "bg-cyan-400/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
                  }`} to="/incomes">
                    <HiCash className="inline mr-2" /> Rendas
                  </NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded font-medium transition ${
                    isActive ? "bg-cyan-400/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
                  }`} to="/accounts">
                    <HiCreditCard className="inline mr-2" /> Contas
                  </NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded font-medium transition ${
                    isActive ? "bg-cyan-400/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
                  }`} to="/goals">
                    <FaBullseye className="inline mr-2" /> Metas
                  </NavLink>
                  <NavLink onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `block px-3 py-2 rounded font-medium transition ${
                    isActive ? "bg-cyan-400/20 text-cyan-400" : "text-gray-300 hover:bg-white/10"
                  }`} to="/settings">
                    <HiCog className="inline mr-2" /> Configurações
                  </NavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded font-medium bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    <HiLogout className="inline mr-2" /> Sair
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
            <Routes>
              <Route path="/" element={<Dashboard userName={userName} getGreeting={getGreeting} />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/incomes" element={<Incomes />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SummaryProvider>
  );
}
