import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";

export default function Incomes() {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
  });

  const [incomes, setIncomes] = useState([]);
  const [message, setMessage] = useState("");
  const { refreshSummary } = useSummary();

  // 🔹 Buscar rendas
  async function fetchIncomes() {
    try {
      const res = await fetch("http://localhost:8080/incomes");
      if (!res.ok) throw new Error("Erro ao buscar rendas");
      const data = await res.json();
      setIncomes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar rendas:", error);
      setIncomes([]);
    }
  }

  // 🔹 Cadastrar renda
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:8080/incomes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setMessage("✅ Renda cadastrada com sucesso!");
        setForm({ description: "", amount: "", date: "" });
        refreshSummary();
        fetchIncomes();
      } else {
        setMessage("❌ Erro ao cadastrar renda.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage("❌ Erro de conexão com o servidor.");
    }
  }

  // 🔹 Excluir renda
  async function deleteIncome(id) {
    if (!confirm("Tem certeza que deseja excluir esta renda?")) return;

    try {
      const res = await fetch(`http://localhost:8080/incomes/delete?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("🗑️ Renda removida com sucesso!");
        refreshSummary();
        fetchIncomes();
      } else {
        setMessage("❌ Erro ao remover renda.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage("❌ Erro de conexão ao tentar excluir.");
    }
  }

  useEffect(() => {
    fetchIncomes();
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Cadastrar Renda</h1>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Descrição (ex: Salário, VR...)"
          className="w-full p-2 border rounded"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />

        <input
          type="number"
          placeholder="Valor"
          className="w-full p-2 border rounded"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <input
          type="date"
          className="w-full p-2 border rounded"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <button
          type="submit"
          className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold py-2 rounded-lg shadow-sm transition"
        >
          + Adicionar Renda
        </button>
      </form>

      {message && (
        <p
          className={`mt-2 text-center ${
            message.startsWith("✅") || message.startsWith("🗑️")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}

      {/* Lista de rendas */}
      <h2 className="text-xl font-semibold mt-8 mb-3 text-center">
        Minhas Rendas
      </h2>

      {Array.isArray(incomes) && incomes.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {incomes.map((inc) => (
            <li
              key={inc.id}
              className="flex justify-between items-center py-2 px-1 hover:bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{inc.description}</p>
                <p className="text-sm text-gray-500">
                  R$ {inc.amount ? inc.amount.toFixed(2) : "0.00"} —{" "}
                  {inc.date
                    ? new Date(inc.date).toLocaleDateString("pt-BR")
                    : "Data não informada"}
                </p>
              </div>
              <button
                onClick={() => deleteIncome(inc.id)}
                className="text-red-500 hover:text-red-700 text-lg"
                title="Excluir"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">
          Nenhuma renda registrada ainda.
        </p>
      )}
    </div>
  );
}
