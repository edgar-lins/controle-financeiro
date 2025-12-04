import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Incomes from "./Incomes";
import Login from "./Login";
import { SummaryProvider } from "./SummaryContext";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) setToken(stored);
  }, []);

  function handleLogin(newToken) {
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <SummaryProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm p-4 flex justify-between items-center mb-6">
            <div className="flex gap-6">
              <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/">Resumo</Link>
              <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/expenses">Gastos</Link>
              <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/incomes">Rendas</Link>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
            >
              Sair
            </button>
          </nav>

          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/incomes" element={<Incomes />} />
          </Routes>
        </div>
      </Router>
    </SummaryProvider>
  );
}
