import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";

export default function Expenses() {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    payment_method: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");
  const { refreshSummary } = useSummary();

  // 🔹 Buscar lista de gastos
  async function fetchExpenses() {
    try {
      const res = await fetch("http://localhost:8080/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.error("Erro ao buscar gastos:", error);
    }
  }

  // 🔹 Cadastrar novo gasto
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:8080/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      if (res.ok) {
        setMessage("✅ Gasto cadastrado com sucesso!");
        setForm({ description: "", amount: "", category: "", payment_method: "" });
        refreshSummary();
        fetchExpenses();
      } else {
        setMessage("❌ Erro ao cadastrar gasto.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage("❌ Erro de conexão com o servidor.");
    }
  }

  // 🔹 Excluir gasto
  async function deleteExpense(id) {
    if (!confirm("Tem certeza que deseja excluir este gasto?")) return;

    try {
      const res = await fetch(`http://localhost:8080/expenses/delete?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("🗑️ Gasto removido com sucesso!");
        refreshSummary();
        fetchExpenses();
      } else {
        setMessage("❌ Erro ao remover gasto.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage("❌ Erro de conexão ao tentar excluir.");
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Cadastrar Gasto</h1>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Descrição"
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
          type="text"
          placeholder="Categoria (fixo, lazer, investimento)"
          className="w-full p-2 border rounded"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />

        <input
          type="text"
          placeholder="Forma de pagamento"
          className="w-full p-2 border rounded"
          value={form.payment_method}
          onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow-sm transition"
        >
          + Adicionar Gasto
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

      {/* Lista de gastos */}
      <h2 className="text-xl font-semibold mt-8 mb-3 text-center">
        Meus Gastos
      </h2>
      {expenses.length === 0 ? (
        <p className="text-center text-gray-500">Nenhum gasto registrado ainda.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {expenses.map((exp) => (
            <li
              key={exp.id}
              className="flex justify-between items-center py-2 px-1 hover:bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{exp.description}</p>
                <p className="text-sm text-gray-500">
                  {exp.category} — R$ {exp.amount.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => deleteExpense(exp.id)}
                className="text-red-500 hover:text-red-700 text-lg"
                title="Excluir"
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
