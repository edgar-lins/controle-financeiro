import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Incomes from "./Incomes";
import Accounts from "./Accounts";
import Goals from "./Goals";
import Settings from "./Settings";
import Login from "./Login";
import Onboarding from "./Onboarding";
import { SummaryProvider } from "./SummaryContext";

// Componente auxiliar para os botões do menu inferior
function BottomNavItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink to={to} className="flex flex-col items-center justify-center relative w-16 h-12 transition-all active:scale-90 duration-200">
      <div className={`flex flex-col items-center justify-center transition-all ${isActive ? "text-primary bg-primary/10 rounded-xl px-4 py-1.5" : "text-secondary opacity-70 hover:opacity-100 hover:text-white"}`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
        <span className="font-label text-[9px] font-medium uppercase tracking-wider mt-0.5">{label}</span>
      </div>
    </NavLink>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(localStorage.getItem("needsOnboarding") === "true");

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
    setNeedsOnboarding(localStorage.getItem("needsOnboarding") === "true");
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("needsOnboarding");
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

  if (needsOnboarding) {
    return (
      <Onboarding 
        onComplete={() => {
          localStorage.removeItem("needsOnboarding");
          setNeedsOnboarding(false);
        }} 
      />
    );
  }

  return (
    <SummaryProvider>
      <Router>
        <div className="min-h-screen bg-surface text-on-surface font-body pb-28 pt-20 selection:bg-primary/30">
          
          {/* TopAppBar Fixo */}
          <header className="fixed top-0 left-0 w-full z-50 bg-[#0b1326]/70 backdrop-blur-xl flex justify-between items-center px-6 py-4 shadow-[0_8px_32px_0_rgba(90,240,179,0.08)] border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
              <div className="flex flex-col">
                <span className="text-secondary text-[10px] font-medium uppercase tracking-widest">{getGreeting()}</span>
                <span className="font-headline font-bold tracking-tight text-white">{userName}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl font-black text-primary tracking-tighter hidden sm:block">ProsperFlow</div>
              <button onClick={handleLogout} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#2d3449]/40 transition-colors active:scale-95 transition-transform" title="Sair">
                <span className="material-symbols-outlined text-error opacity-80 hover:opacity-100">logout</span>
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
            <Routes>
              <Route path="/" element={<Dashboard userName={userName} />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/incomes" element={<Incomes />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

          {/* FAB: Floating Action Button (Global) */}
          <div className="fixed bottom-[100px] right-6 z-40">
            <button className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-[0_12px_24px_rgba(90,240,179,0.3)] hover:scale-105 active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-3xl font-bold">add</span>
            </button>
          </div>

          {/* BottomNavBar */}
          <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-[#2d3449]/80 backdrop-blur-2xl rounded-t-[1.5rem] z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] border-t border-white/5">
            <BottomNavItem to="/" icon="home" label="Resumo" />
            <BottomNavItem to="/expenses" icon="trending_down" label="Gastos" />
            <BottomNavItem to="/incomes" icon="trending_up" label="Rendas" />
            <BottomNavItem to="/accounts" icon="account_balance_wallet" label="Contas" />
            <BottomNavItem to="/goals" icon="ads_click" label="Metas" />
          </nav>

        </div>
      </Router>
    </SummaryProvider>
  );
}