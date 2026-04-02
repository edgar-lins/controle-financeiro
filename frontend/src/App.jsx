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
  
  // Novo Estado para controlar o Menu Dropdown do Perfil
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
            
            {/* Bloco Relativo do Perfil + Menu Dropdown */}
            <div className="relative">
              {/* Botão de Perfil */}
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity focus:outline-none"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-primary/20 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-primary">person</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-secondary text-[10px] font-medium uppercase tracking-widest">{getGreeting()}</span>
                  <span className="font-headline font-bold tracking-tight text-white flex items-center gap-1">
                    {userName} 
                    <span className={`material-symbols-outlined text-sm transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </span>
                </div>
              </button>

              {/* O Dropdown em si */}
              {isProfileMenuOpen && (
                <>
                  {/* Fundo invisível para fechar o menu ao clicar fora */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsProfileMenuOpen(false)}
                  ></div>
                  
                  {/* Caixa do Menu com Glassmorphism */}
                  <div className="absolute top-14 left-0 w-56 bg-surface-container-low/95 backdrop-blur-2xl border border-outline-variant/20 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.5)] py-2 z-50 animate-fade-in origin-top-left">
                    
                    <div className="px-4 py-3 border-b border-outline-variant/10 mb-1 flex justify-between items-center bg-surface-container-highest/20 mx-2 rounded-lg">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary">Conta Free</p>
                        <p className="text-[10px] text-primary mt-0.5">Faça upgrade p/ PRO</p>
                      </div>
                      <span className="material-symbols-outlined text-primary text-xl">workspace_premium</span>
                    </div>
                    
                    {/* Atalho único para Configurações */}
                    <NavLink 
                      to="/settings" 
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-secondary hover:text-white hover:bg-surface-container-high transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">settings</span>
                      Configurações
                    </NavLink>

                    <div className="h-px bg-outline-variant/10 my-1 mx-4"></div>
                    
                    <button 
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-error/80 hover:text-error hover:bg-error-container/10 transition-colors w-full text-left"
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      Sair da Conta
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Logo Direita */}
            <div className="flex items-center gap-4">
              <div className="text-xl font-black text-primary tracking-tighter">ProsperFlow</div>
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

          {/* BottomNavBar */}
          <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-2 pb-6 pt-3 bg-[#2d3449]/80 backdrop-blur-2xl rounded-t-[1.5rem] z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.4)] border-t border-white/5">
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