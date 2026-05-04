import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Incomes from "./Incomes";
import Accounts from "./Accounts";
import Goals from "./Goals";
import Settings from "./Settings";
import Login from "./Login";
import Onboarding from "./Onboarding";
import ResetPassword from "./ResetPassword";
import { SummaryProvider } from "./SummaryContext";
import { BrotoLogo } from "./components/BrotoLogo";
import { Icon } from "./components/Icon";

const NAV_ITEMS = [
  { to: "/",         icon: "home",                    label: "Início"  },
  { to: "/expenses", icon: "trending_down",            label: "Gastos"  },
  { to: "/accounts", icon: "account_balance_wallet",   label: "Contas"  },
  { to: "/goals",    icon: "ads_click",                label: "Metas"   },
  { to: "/settings", icon: "settings",                 label: "Mais"    },
];

function BottomNav() {
  const location = useLocation();
  return (
    <nav
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(11,16,13,1) 60%, rgba(11,16,13,0))",
        display: "flex", justifyContent: "space-around", alignItems: "flex-start",
        paddingTop: 10, paddingBottom: 28, zIndex: 40,
      }}
    >
      {NAV_ITEMS.map((it) => {
        const isActive = location.pathname === it.to;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56, textDecoration: "none" }}
          >
            <div style={{
              padding: "6px 16px", borderRadius: 999,
              background: isActive ? "rgba(127,224,160,0.22)" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
            }}>
              <Icon name={it.icon} size={22} filled={isActive}
                color={isActive ? "var(--b-primary)" : "var(--b-muted)"} />
            </div>
            <span style={{
              fontSize: 11, color: isActive ? "var(--b-primary)" : "var(--b-muted)",
              fontWeight: isActive ? 600 : 500, letterSpacing: -0.1,
            }}>{it.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userName, setUserName] = useState("");
  const [needsOnboarding, setNeedsOnboarding] = useState(localStorage.getItem("needsOnboarding") === "true");
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    const firstName = localStorage.getItem("firstName");
    if (stored) { setToken(stored); setUserName(firstName || ""); }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogin(newToken: string) {
    setToken(newToken);
    setUserName(localStorage.getItem("firstName") || "");
    setNeedsOnboarding(localStorage.getItem("needsOnboarding") === "true");
  }

  function handleLogout() {
    ["token", "firstName", "lastName", "needsOnboarding"].forEach(k => localStorage.removeItem(k));
    setToken(null);
    setUserName("");
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Bom dia";
    if (h >= 12 && h < 18) return "Boa tarde";
    return "Boa noite";
  }

  if (!token) {
    if (window.location.pathname === "/reset-password") {
      return (
        <Router>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </Router>
      );
    }
    return <Login onLogin={handleLogin} />;
  }

  if (needsOnboarding) {
    return (
      <Onboarding onComplete={() => { localStorage.removeItem("needsOnboarding"); setNeedsOnboarding(false); }} />
    );
  }

  const initial = userName.charAt(0).toUpperCase() || "?";

  return (
    <SummaryProvider>
      <Router>
        <div style={{ minHeight: "100vh", background: "var(--b-bg)", paddingTop: 64, paddingBottom: 96 }}>

          {/* Top header */}
          <header style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
            background: "rgba(14,20,16,0.85)", backdropFilter: "blur(16px)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {/* Avatar + greeting */}
            <div style={{ position: "relative" }} ref={menuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer" }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 999,
                  background: `linear-gradient(135deg, var(--b-primary-deep), var(--b-primary))`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--b-primary-ink)", fontWeight: 700, fontSize: 15,
                }}>{initial}</div>
                <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                  <span style={{ fontSize: 11, color: "var(--b-muted)", fontWeight: 500 }}>{getGreeting()},</span>
                  <span style={{ fontSize: 15, color: "var(--b-text)", fontWeight: 600, letterSpacing: -0.2 }}>{userName || "Usuário"}</span>
                </div>
                <span style={{ transform: isProfileMenuOpen ? "rotate(180deg)" : "none", transition: "transform .2s", display: "inline-flex" }}>
                  <Icon name="expand_more" size={18} color="var(--b-muted)" />
                </span>
              </button>

              {isProfileMenuOpen && (
                <div style={{
                  position: "absolute", top: 50, left: 0, width: 220,
                  background: "var(--b-surface-hi)", border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 20, boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                  padding: "8px 0", zIndex: 100,
                }} className="animate-fade-in">
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 4 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--b-muted)" }}>Conta Gratuita</p>
                    <p style={{ fontSize: 11, color: "var(--b-primary)", marginTop: 2 }}>Faça upgrade para PRO</p>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", color: "var(--b-muted)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}
                  >
                    <Icon name="settings" size={18} color="var(--b-muted)" />
                    Configurações
                  </NavLink>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 16px" }} />
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", color: "var(--b-rose)", background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", fontSize: 14, fontWeight: 500 }}
                  >
                    <Icon name="logout" size={18} color="var(--b-rose)" />
                    Sair da conta
                  </button>
                </div>
              )}
            </div>

            {/* Logo */}
            <BrotoLogo size={22} withWordmark />
          </header>

          {/* Page content */}
          <main style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
            <Routes>
              <Route path="/"         element={<Dashboard userName={userName} />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/incomes"  element={<Incomes />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/goals"    element={<Goals />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

          <BottomNav />
        </div>
      </Router>
    </SummaryProvider>
  );
}
