import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { HiTrash, HiCalendar, HiPencil, HiChevronDown } from "react-icons/hi";
import { MdAttachMoney } from "react-icons/md";
import { MdAccountBalanceWallet } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/datepicker.css";
import { formatCurrencyBR } from "./utils/format";
import API_URL from "./config/api";
import { CurrencyInput } from "./components/CurrencyInput";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import { PageHeader } from "./components/PageHeader";

// Normalize dates from API (with or without time component)
const parseDate = (value) => {
  if (!value) return null;
  try {
    return value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  } catch (e) {
    return null;
  }
};

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

export default function Incomes() {
  const now = new Date();
  const defaultMonth = String(now.getMonth() + 1);
  const defaultYear = String(now.getFullYear());

  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: "",
    account_id: "",
  });

  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, incomeId: null, incomeDesc: "" });
  const { refreshSummary } = useSummary();

  // 🔹 Filtros
  const [filterMonth, setFilterMonth] = useState(defaultMonth);
  const [filterYear, setFilterYear] = useState(defaultYear);
  const [showAll, setShowAll] = useState(false);

  function startEdit(income) {
    setEditingId(income.id);
    const parsed = parseDate(income.date);
    const dateStr = parsed ? parsed.toISOString().split('T')[0] : "";
    setForm({
      description: income.description,
      amount: income.amount.toString(),
      date: dateStr,
      account_id: income.account_id ? income.account_id.toString() : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ description: "", amount: "", date: "", account_id: "" });
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

  // 🔹 Buscar rendas
  async function fetchIncomes() {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = API_URL || "http://localhost:8080";
      const params = new URLSearchParams();
      if (!showAll) {
        if (filterMonth) params.set("month", String(filterMonth));
        if (filterYear) params.set("year", String(filterYear));
      }

      const res = await fetch(`${apiUrl}/incomes${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar rendas");
      const data = await res.json();
      setIncomes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar rendas:", error);
      setIncomes([]);
    }
  }

  // 🔹 Cadastrar ou atualizar renda
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const apiUrl = API_URL || "http://localhost:8080";
      const url = editingId
        ? `${apiUrl}/incomes/update?id=${editingId}`
        : `${apiUrl}/incomes`;

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
        setToast({ show: true, message: editingId ? "Renda atualizada!" : "Renda cadastrada!", type: "success" });
        setForm({ description: "", amount: "", date: "", account_id: "" });
        setEditingId(null);
        refreshSummary();
        fetchIncomes();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao cadastrar renda", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  // 🔹 Excluir renda
  async function deleteIncome(id) {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/incomes/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setToast({ show: true, message: "Renda removida!", type: "success" });
        refreshSummary();
        fetchIncomes();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao remover renda", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, incomeId: null, incomeDesc: "" });
  }

  useEffect(() => {
    fetchIncomes();
    fetchAccounts();
  }, [filterMonth, filterYear, showAll]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Minhas Rendas" 
        subtitle="Acompanhe suas fontes de renda"
        description="Registre todas as suas fontes de renda incluindo salário, freelances, investimentos e outras rendas. Acompanhe o histórico de recebimentos e visualize a tendência de seus ganhos ao longo do tempo. As rendas são utilizadas para calcular o resumo financeiro."
        colorClass="from-emerald-600 to-teal-600"
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Filtros */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-3 items-end shadow-inner shadow-black/20">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Mês</label>
            <div className="relative">
              <select
                className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 text-white rounded-lg py-2 pl-3 pr-12 appearance-none focus:border-emerald-400 focus:outline-none focus:shadow-[0_0_0_2px_rgba(16,185,129,0.25)] transition"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value={defaultMonth}>Atual</option>
                      {monthNames.map((name, idx) => (
                        <option key={name} value={idx + 1}>{name}</option>
                      ))}
              </select>
              <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ano</label>
            <div className="relative">
              <select
                className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-600 text-white rounded-lg py-2 pl-3 pr-12 appearance-none focus:border-emerald-400 focus:outline-none focus:shadow-[0_0_0_2px_rgba(16,185,129,0.25)] transition"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value={defaultYear}>Atual</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                id="showAllIncomes"
                type="checkbox"
                className="sr-only peer"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              <span className="w-10 h-6 bg-slate-700 border border-slate-600 rounded-full peer-checked:bg-emerald-600 peer-checked:border-emerald-500 transition-all shadow-inner" />
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow" />
              <span className="ml-3 text-sm text-gray-300">Ver todos</span>
            </label>

            <button
              type="button"
              className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-emerald-600 hover:to-emerald-500 text-white px-4 py-2 rounded-lg font-semibold transition shadow-md hover:shadow-emerald-500/20"
              onClick={() => { setFilterMonth(defaultMonth); setFilterYear(defaultYear); setShowAll(false); }}
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 md:sticky md:top-6 md:self-start md:max-h-[calc(100vh-3rem)] md:overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MdAttachMoney className="text-emerald-400" /> 
            {editingId ? "Editar Renda" : "Nova Renda"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Salário, VR, Freelance..."
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-teal-400 focus:outline-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Valor</label>
              <CurrencyInput
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-emerald-400 focus:outline-none"
                value={form.amount}
                onChange={(val) => setForm({ ...form, amount: val })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Conta</label>
              <select
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-emerald-400 focus:outline-none"
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
              <div className="relative flex items-center">
                <DatePicker
                  selected={form.date ? parseDate(form.date) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateStr = date.toISOString().split('T')[0];
                      setForm({ ...form, date: dateStr });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecione a data"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-emerald-400 focus:outline-none"
                />
                <HiCalendar className="absolute right-3 text-gray-400 pointer-events-none text-lg" />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                {editingId ? "Salvar" : "+ Adicionar Renda"}
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
          {Array.isArray(incomes) && incomes.length > 0 ? (
            <div className="grid gap-3">
              {incomes.map((inc) => (
                <div key={inc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{inc.description}</h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-400">
                        {/* Data */}
                        {(() => {
                          const parsed = parseDate(inc.date);
                          if (!parsed) return "Data não informada";
                          return parsed.toLocaleDateString("pt-BR", { 
                            weekday: "short", 
                            year: "numeric", 
                            month: "short", 
                            day: "numeric" 
                          });
                        })()}
                        {/* Conta utilizada */}
                        {inc.account_id && (() => {
                          const acc = accounts.find(a => a.id === parseInt(inc.account_id));
                          return acc ? (
                            <span className="flex items-center gap-1 pl-2 border-l border-slate-800 text-emerald-300 font-medium">
                              <MdAccountBalanceWallet className="text-emerald-400 text-base" />
                              {acc.name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(inc)}
                        className="text-slate-400 hover:text-slate-300 transition duration-200 flex items-center justify-center p-2 min-w-[44px] min-h-[44px]"
                        title="Editar"
                      >
                        <HiPencil className="text-xl" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, incomeId: inc.id, incomeDesc: inc.description })}
                        className="text-red-400 hover:text-red-300 transition duration-200 flex items-center justify-center p-2 min-w-[44px] min-h-[44px]"
                        title="Excluir"
                      >
                        <HiTrash className="text-xl" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-2xl font-bold text-slate-300">{formatCurrencyBR(inc.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg">Nenhuma renda registrada</p>
              <p className="text-gray-500 text-sm mt-2">Comece a registrar suas rendas ao lado</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Renda"
        message={`Tem certeza que deseja excluir a renda "${deleteModal.incomeDesc}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteIncome(deleteModal.incomeId)}
        onCancel={() => setDeleteModal({ isOpen: false, incomeId: null, incomeDesc: "" })}
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
