import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { HiTrash, HiCalendar, HiPencil, HiLightningBolt, HiCreditCard, HiCash } from "react-icons/hi";
import { MdAttachMoney } from "react-icons/md";
import { MdAccountBalanceWallet } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/datepicker.css";
import { formatCurrencyBR } from "./utils/format";
import API_URL from "./config/api";
import { CategorySelect } from "./components/CategorySelect";
import { CurrencyInput } from "./components/CurrencyInput";
import { PageHeader } from "./components/PageHeader";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";

// Normalize date strings coming from API (with or without time)
const parseDate = (value) => {
  if (!value) return null;
  try {
    return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  } catch (e) {
    return null;
  }
};

const paymentOptions = [
  { value: "pix", label: "Pix", icon: <HiLightningBolt className="text-lime-300" /> },
  { value: "debito", label: "Débito", icon: <HiCreditCard className="text-sky-300" /> },
  { value: "credito", label: "Crédito", icon: <HiCreditCard className="text-purple-300" /> },
  { value: "dinheiro", label: "Dinheiro", icon: <HiCash className="text-amber-300" /> },
  { value: "boleto", label: "Boleto", icon: <HiCreditCard className="text-emerald-300" /> },
  { value: "vale", label: "VR/VA", icon: <HiCreditCard className="text-pink-300" /> },
];

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Normalizar nome de forma de pagamento para exibição
const getPaymentMethodLabel = (value) => {
  const option = paymentOptions.find(opt => opt.value === value);
  return option ? option.label : value;
};

export default function Expenses() {
  const now = new Date();
  const defaultMonth = String(now.getMonth() + 1);
  const defaultYear = String(now.getFullYear());

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "",
    payment_method: "",
    date: "",
    account_id: "",
  });

  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, expenseId: null, expenseDesc: "" });
  const { refreshSummary } = useSummary();

  const [filterMonth, setFilterMonth] = useState(defaultMonth);
  const [filterYear, setFilterYear] = useState(defaultYear);
  const [showAll, setShowAll] = useState(false);

  function startEdit(expense) {
    setEditingId(expense.id);
    const parsed = parseDate(expense.date);
    const dateStr = parsed ? parsed.toISOString().split('T')[0] : "";
    setForm({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category || "",
      payment_method: expense.payment_method || "",
      date: dateStr,
      account_id: expense.account_id ? expense.account_id.toString() : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ description: "", amount: "", category: "", payment_method: "", date: "", account_id: "" });
  }

  // 🔹 Buscar lista de contas
  async function fetchAccounts() {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/accounts`, {
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
      const apiUrl = API_URL || "http://localhost:8080";
      const params = new URLSearchParams();
      if (!showAll) {
        if (filterMonth) params.set("month", String(filterMonth));
        if (filterYear) params.set("year", String(filterYear));
      }

      const res = await fetch(`${apiUrl}/expenses${params.toString() ? `?${params.toString()}` : ""}`, {
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
      const apiUrl = API_URL || "http://localhost:8080";
      const url = editingId
        ? `${apiUrl}/expenses/update?id=${editingId}`
        : `${apiUrl}/expenses`;

      const payloadDate = form.date || new Date().toISOString().split("T")[0];
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          date: payloadDate,
          account_id: form.account_id ? parseInt(form.account_id) : null,
        }),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Gasto atualizado!" : "Gasto cadastrado!", type: "success" });
        setForm({ description: "", amount: "", category: "", payment_method: "", date: "", account_id: "" });
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
      const apiUrl = API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/expenses/delete?id=${id}`, {
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
  }, [filterMonth, filterYear, showAll]);

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
        {/* Filtros */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-end shadow-inner shadow-black/20">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mês</label>
            <select
              className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-violet-400 focus:outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,0.25)] transition"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value={defaultMonth}>Atual</option>
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ano</label>
            <select
              className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:border-violet-400 focus:outline-none focus:shadow-[0_0_0_2px_rgba(139,92,246,0.25)] transition"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value={defaultYear}>Atual</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id="showAll"
                type="checkbox"
                className="sr-only peer"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              <span className="w-10 h-6 bg-slate-700 border border-slate-600 rounded-full peer-checked:bg-violet-600 peer-checked:border-violet-500 transition-all shadow-inner" />
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow" />
              <span className="ml-3 text-sm text-gray-300">Ver todos</span>
            </label>

            <button
              type="button"
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-violet-600 hover:to-violet-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md hover:shadow-violet-500/20"
              onClick={() => { setFilterMonth(defaultMonth); setFilterYear(defaultYear); setShowAll(false); }}
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
              <div className="relative flex items-center">
                <DatePicker
                  selected={form.date ? parseDate(form.date) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateStr = date.toISOString().split("T")[0];
                      setForm({ ...form, date: dateStr });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecione a data"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-violet-400 focus:outline-none"
                />
                <HiCalendar className="absolute right-3 text-gray-400 pointer-events-none text-lg" />
              </div>
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
              <div className="flex flex-wrap gap-2">
                {paymentOptions.map((opt) => {
                  const isActive = form.payment_method === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, payment_method: opt.value })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition text-sm ${
                        isActive
                          ? "bg-violet-600 border-violet-400 text-white"
                          : "bg-slate-700 border-slate-600 text-gray-200 hover:border-violet-400"
                      }`}
                      aria-pressed={isActive}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
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
                <div key={exp.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{exp.description}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-400">
                        {/* Data */}
                        {exp.date && (() => {
                          const parsed = parseDate(exp.date);
                          return parsed ? (
                            <span>
                              {parsed.toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          ) : (
                            <span>Data inválida</span>
                          );
                        })()}
                        {/* Categoria */}
                        {exp.category ? (
                          <span>
                            {exp.category === "fixo" && "Fixo"}
                            {exp.category === "lazer" && "Lazer"}
                            {exp.category === "investimento" && "Investimento"}
                          </span>
                        ) : "Sem categoria"}
                        {/* Forma de pagamento */}
                        {exp.payment_method && (
                          <span className="pl-2 border-l border-slate-700">{getPaymentMethodLabel(exp.payment_method)}</span>
                        )}
                        {/* Conta utilizada */}
                        {exp.account_id && (() => {
                          const acc = accounts.find(a => a.id === parseInt(exp.account_id));
                          return acc ? (
                            <span className="flex items-center gap-1 pl-2 border-l border-slate-800 text-violet-300 font-medium">
                              <MdAccountBalanceWallet className="text-violet-400 text-base" />
                              {acc.name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => startEdit(exp)}
                        className="text-slate-400 hover:text-slate-300 transition duration-200 flex items-center gap-1"
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
                    <p className="text-2xl font-bold text-slate-300">{formatCurrencyBR(exp.amount)}</p>
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
