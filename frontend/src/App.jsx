import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import Expenses from "./Expenses";
import Incomes from "./Incomes";
import { SummaryProvider } from "./SummaryContext";

export default function App() {
  return (
    <SummaryProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm p-4 flex justify-center gap-6 mb-6">
            <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/">Resumo</Link>
            <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/expenses">Gastos</Link>
            <Link className="text-gray-700 hover:text-blue-600 font-medium" to="/incomes">Rendas</Link>
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
