import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const { refreshKey } = useSummary();

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (month) params.set("month", String(month));
        if (year) params.set("year", String(year));
        const url = `http://localhost:8080/summary${params.toString() ? `?${params.toString()}` : ""}`;
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSummary(data);
      } catch (error) {
        console.error("Erro ao buscar resumo:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [refreshKey, month, year]); // 👈 Recarrega quando filtros mudam

  if (loading)
    return <p className="text-center mt-10 text-gray-600">Carregando resumo...</p>;
  if (!summary)
    return <p className="text-center mt-10 text-red-500">Erro ao carregar dados 😢</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-4 text-center">Resumo Financeiro</h1>
      <p className="text-center text-gray-500 mb-6">
        {summary.mes} / {summary.ano}
      </p>

      {/* Filtros de mês/ano */}
      <div className="flex items-end gap-3 mb-6 justify-center">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Mês</label>
          <select
            className="border rounded p-2"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">Atual</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Ano</label>
          <input
            type="number"
            className="border rounded p-2 w-28"
            placeholder={summary.ano}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <button
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded"
          onClick={() => { setMonth(""); setYear(""); }}
        >
          Limpar
        </button>
      </div>

      {/* Bloco de renda e gastos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-100 p-4 rounded-xl text-center">
          <p className="text-sm text-gray-600">Renda Total</p>
          <p className="text-xl font-bold text-green-700">
            R$ {summary.renda_total.toFixed(2)}
          </p>
        </div>

        <div className="bg-red-100 p-4 rounded-xl text-center">
          <p className="text-sm text-gray-600">Gastos Totais</p>
          <p className="text-xl font-bold text-red-700">
            R$ {summary.gasto_total.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Distribuição 50/30/20 */}
      <div className="mt-6 bg-gray-100 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-3 text-center">
          Distribuição 50 / 30 / 20
        </h2>
        <div className="space-y-3">
          <Category
            name="Fixos"
            ideal={summary.ideal_fixos}
            real={summary.real_fixos}
            color="blue"
          />
          <Category
            name="Lazer"
            ideal={summary.ideal_lazer}
            real={summary.real_lazer}
            color="purple"
          />
          <Category
            name="Investimentos"
            ideal={summary.ideal_invest}
            real={summary.real_invest}
            color="yellow"
          />
        </div>
      </div>

      {/* Exportar CSV */}
      <div className="mt-6 flex justify-center gap-3">
        <ExportCSV endpoint="http://localhost:8080/expenses" filename="gastos.csv" label="Exportar Gastos" />
        <ExportCSV endpoint="http://localhost:8080/incomes" filename="rendas.csv" label="Exportar Rendas" />
      </div>

      {/* Saldo Restante */}
      <div className="mt-4 bg-white p-4 rounded-xl text-center shadow-sm">
        <p className="text-sm text-gray-600">Saldo Restante Real</p>
        <p
          className={`text-2xl font-bold ${
            summary.saldo_restante >= 0 ? "text-green-700" : "text-red-700"
          }`}
        >
          R$ {summary.saldo_restante.toFixed(2)}
        </p>
      </div>


    </div>
  );
}

// Componente para exibir cada categoria do 50/30/20
function Category({ name, ideal, real, color }) {
  const perc = ideal > 0 ? ((real / ideal) * 100).toFixed(1) : 0;
  const statusColor =
    perc < 80
      ? "text-yellow-600"
      : perc <= 100
      ? "text-green-600"
      : "text-red-600";

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-500">Ideal: R$ {ideal.toFixed(2)}</p>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${statusColor}`}>
          R$ {real ? real.toFixed(2) : "0.00"}
        </p>
        <p className="text-xs text-gray-500">{perc}% do ideal</p>
      </div>
    </div>
  );
}

// Utilitário simples para exportar CSV
function ExportCSV({ endpoint, filename, label }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) {
        alert("Sem dados para exportar.");
        return;
      }
      const headers = Object.keys(rows[0]);
      const csv = [headers.join(","), ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erro ao exportar:", e);
      alert("Erro ao exportar CSV.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-60"
      disabled={downloading}
    >
      {downloading ? "Exportando..." : label}
    </button>
  );
}
