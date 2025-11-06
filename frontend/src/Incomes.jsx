import { useState } from "react";

export default function Incomes() {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
  });

  const [message, setMessage] = useState("");

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
      } else {
        setMessage("❌ Erro ao cadastrar renda.");
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage("❌ Erro de conexão com o servidor.");
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Cadastrar Renda</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
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

        <div className="pt-3">
            <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95"
                style={{ color: "#fff", backgroundColor: "#16a34a" }}
            >
            + Adicionar Renda
            </button>
        </div>
        </form>

        {message && (
        <p
            className={`mt-4 text-center ${
            message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
        >
            {message}
        </p>
        )}


      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
