import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { HiTrash, HiCalendar, HiPencil } from "react-icons/hi";
import { MdAttachMoney } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/datepicker.css";
import { formatCurrencyBR } from "./utils/format";
import { CategorySelect } from "./components/CategorySelect";
import { CurrencyInput } from "./components/CurrencyInput";
import { PageHeader } from "./components/PageHeader";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";

export default function Expenses() {
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    payment_method: "",
    account_id: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, expenseId: null, expenseDesc: "" });
  const { refreshSummary } = useSummary();

  function startEdit(expense) {
    setEditingId(expense.id);
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      payment_method: expense.payment_method,
      account_id: expense.account_id ? expense.account_id.toString() : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ description: "", amount: "", category: "", payment_method: "", account_id: "" });
  }

  // 🔹 Buscar lista de contas
  async function fetchAccounts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar contas");
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
      setAccounts([]);
    }
  }

  // 🔹 Buscar lista de gastos
  async function fetchExpenses() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/expenses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar gastos");
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar gastos:", error);
      setExpenses([]);
    }
  }

  // 🔹 Cadastrar ou atualizar gasto
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const url = editingId
        ? `http://localhost:8080/expenses/update?id=${editingId}`
        : "http://localhost:8080/expenses";
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          account_id: form.account_id ? parseInt(form.account_id) : null,
        }),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Gasto atualizado!" : "Gasto cadastrado!", type: "success" });
        setForm({ description: "", amount: "", category: "", payment_method: "", account_id: "" });
        setEditingId(null);
        refreshSummary();
        fetchExpenses();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao cadastrar gasto", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  // 🔹 Excluir gasto
  async function deleteExpense(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/expenses/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setToast({ show: true, message: "Gasto removido!", type: "success" });
        refreshSummary();
        fetchExpenses();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao remover gasto", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, expenseId: null, expenseDesc: "" });
  }

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Meus Gastos" 
        subtitle="Visualize e gerencie despesas"
        description="Registre todos os seus gastos e despesas. Acompanhe o histórico de movimentações, categorize suas despesas e analise padrões de consumo. Os gastos são automaticamente classificados de acordo com sua distribuição de renda (Despesas Fixas, Lazer e Investimentos)."
        colorClass="from-violet-600 to-purple-600"
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 sticky top-24">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MdAttachMoney className="text-violet-400" /> 
            {editingId ? "Editar Gasto" : "Novo Gasto"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Supermercado"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-violet-400 focus:outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
              <CurrencyInput
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-violet-400 focus:outline-none"
                value={form.amount}
                onChange={(val) => setForm({ ...form, amount: val })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
              <CategorySelect
                value={form.category}
                onChange={(category) => setForm({ ...form, category })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Conta</label>
              <select
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-violet-400 focus:outline-none"
                value={form.account_id}
                onChange={(e) => setForm({ ...form, account_id: e.target.value })}
              >
                <option value="">Selecione uma conta (opcional)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} - {formatCurrencyBR(acc.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Forma de Pagamento</label>
              <input
                type="text"
                placeholder="Ex: Débito, Crédito..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-violet-400 focus:outline-none"
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                {editingId ? "Salvar" : "+ Adicionar Gasto"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="md:col-span-2">
          {Array.isArray(expenses) && expenses.length > 0 ? (
            <div className="grid gap-3">
              {expenses.map((exp) => (
                <div key={exp.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:border-violet-400/50 transition duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{exp.description}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {exp.category ? (
                          <span>
                            {exp.category === "fixo" && "Fixo"}
                            {exp.category === "lazer" && "Lazer"}
                            {exp.category === "investimento" && "Investimento"}
                          </span>
                        ) : "Sem categoria"}
                        {exp.payment_method && ` • ${exp.payment_method}`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => startEdit(exp)}
                        className="text-violet-400 hover:text-violet-300 transition duration-200 flex items-center gap-1"
                        title="Editar"
                      >
                        <HiPencil className="text-lg" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, expenseId: exp.id, expenseDesc: exp.description })}
                        className="text-red-400 hover:text-red-300 transition duration-200 flex items-center gap-1"
                        title="Excluir"
                      >
                        <HiTrash className="text-lg" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-2xl font-bold text-violet-400">{formatCurrencyBR(exp.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg">Nenhum gasto registrado</p>
              <p className="text-gray-500 text-sm mt-2">Comece a registrar seus gastos ao lado</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Gasto"
        message={`Tem certeza que deseja excluir o gasto "${deleteModal.expenseDesc}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteExpense(deleteModal.expenseId)}
        onCancel={() => setDeleteModal({ isOpen: false, expenseId: null, expenseDesc: "" })}
        confirmText="Excluir"
        cancelText="Cancelar"
        isDangerous={true}
      />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "success" })}
        />
      )}
    </div>
  );
}
