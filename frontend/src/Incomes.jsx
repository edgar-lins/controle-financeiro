import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { HiTrash, HiCalendar, HiPencil } from "react-icons/hi";
import { MdAttachMoney } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./styles/datepicker.css";
import { formatCurrencyBR } from "./utils/format";
import { CurrencyInput } from "./components/CurrencyInput";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import { PageHeader } from "./components/PageHeader";

export default function Incomes() {
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

  function startEdit(income) {
    setEditingId(income.id);
    const dateStr = income.date ? new Date(income.date).toISOString().split('T')[0] : "";
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

  // 🔹 Buscar rendas
  async function fetchIncomes() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/incomes", {
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
      const url = editingId
        ? `http://localhost:8080/incomes/update?id=${editingId}`
        : "http://localhost:8080/incomes";
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          date: form.date ? new Date(form.date).toISOString() : new Date().toISOString(),
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
      const res = await fetch(`http://localhost:8080/incomes/delete?id=${id}`, {
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
  }, []);

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
        {/* Form */}
        <div className="md:col-span-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 sticky top-24">
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
                  selected={form.date ? new Date(form.date) : null}
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
                <div key={inc.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 hover:border-teal-400/50 transition duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">{inc.description}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {inc.date
                          ? new Date(inc.date).toLocaleDateString("pt-BR", { 
                              weekday: "short", 
                              year: "numeric", 
                              month: "short", 
                              day: "numeric" 
                            })
                          : "Data não informada"}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => startEdit(inc)}
                        className="text-emerald-400 hover:text-emerald-300 transition duration-200 flex items-center gap-1"
                        title="Editar"
                      >
                        <HiPencil className="text-lg" />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, incomeId: inc.id, incomeDesc: inc.description })}
                        className="text-red-400 hover:text-red-300 transition duration-200 flex items-center gap-1"
                        title="Excluir"
                      >
                        <HiTrash className="text-lg" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrencyBR(inc.amount)}</p>
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
