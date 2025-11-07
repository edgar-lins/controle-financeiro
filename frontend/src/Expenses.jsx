import { useState } from "react";
import { useSummary } from "./SummaryContext"; // 👈 importa

export default function Expenses() {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    payment_method: "",
  });

  const [message, setMessage] = useState("");
  const { refreshSummary } = useSummary(); // 👈 pega função

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
        refreshSummary(); // 👈 atualiza dashboard
      } else {
        setMessage("❌ Erro ao cadastrar gasto.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage("❌ Erro de conexão com o servidor.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Cadastrar Gasto</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded"
        >
          Adicionar Gasto
        </button>
      </form>

      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
