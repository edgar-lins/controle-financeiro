import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { refreshKey } = useSummary();

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8080/summary");
        const data = await res.json();
        setSummary(data);
      } catch (error) {
        console.error("Erro ao buscar resumo:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [refreshKey]); // 👈 Recarrega quando refreshKey muda

  if (loading) return <p className="text-center mt-10 text-gray-600">Carregando resumo...</p>;
  if (!summary) return <p className="text-center mt-10 text-red-500">Erro ao carregar dados 😢</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 text-gray-800">
      <h1 className="text-3xl font-bold mb-4 text-center">Resumo Financeiro</h1>
      <p className="text-center text-gray-500 mb-6">
        {summary.mes} / {summary.ano}
      </p>

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

      <div className="mt-6 bg-gray-100 p-4 rounded-xl">
        <h2 className="text-lg font-semibold mb-3 text-center">Distribuição 50 / 30 / 20</h2>
        <div className="space-y-3">
          <Category name="Fixos" ideal={summary.ideal_fixos} real={summary.real_fixos} color="blue" />
          <Category name="Lazer" ideal={summary.ideal_lazer} real={summary.real_lazer} color="purple" />
          <Category name="Investimentos" ideal={summary.ideal_invest} real={summary.real_invest} color="yellow" />
        </div>
      </div>
    </div>
  );
}

// Componente para exibir cada categoria do 50/30/20
function Category({ name, ideal, real, color }) {
  const perc = ((real / ideal) * 100).toFixed(1);
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
        <p className={`font-semibold ${statusColor}`}>R$ {real.toFixed(2)}</p>
        <p className="text-xs text-gray-500">{perc}% do ideal</p>
      </div>
    </div>
  );
}
