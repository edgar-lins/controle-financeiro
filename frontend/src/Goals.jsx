import { useEffect, useState } from "react";
import { HiTrash, HiCalendar, HiPencil, HiPlus } from "react-icons/hi";
import { MdAttachMoney } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatCurrencyBR } from "./utils/format";
import { CurrencyInput } from "./components/CurrencyInput";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import { PageHeader } from "./components/PageHeader";
import "./styles/datepicker.css";

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    deadline: "",
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, goalId: null, goalName: "" });
  const [addMoneyModal, setAddMoneyModal] = useState({ isOpen: false, goalId: null, goalName: "", currentAmount: 0 });
  const [addMoneyForm, setAddMoneyForm] = useState({ amount: "", account_id: "" });

  async function fetchAccounts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
      setAccounts([]);
    }
  }

  async function fetchGoals() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/goals", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro:", error);
      setGoals([]);
    }
  }

  function startEdit(goal) {
    setEditingId(goal.id);
    const dateStr = goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : "";
    setForm({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: goal.current_amount.toString(),
      deadline: dateStr,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", target_amount: "", current_amount: "", deadline: "" });
  }

  function openAddMoney(goal) {
    setAddMoneyModal({ 
      isOpen: true, 
      goalId: goal.id, 
      goalName: goal.name,
      currentAmount: goal.current_amount 
    });
    setAddMoneyForm({ amount: "", account_id: "" });
  }

  async function handleAddMoney() {
    if (!addMoneyForm.amount || !addMoneyForm.account_id) {
      setToast({ show: true, message: "Preencha o valor e selecione a conta", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const amount = parseFloat(addMoneyForm.amount);
      const newCurrentAmount = addMoneyModal.currentAmount + amount;

      // Update goal
      const resGoal = await fetch(`http://localhost:8080/goals/add-money?id=${addMoneyModal.goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          account_id: parseInt(addMoneyForm.account_id),
        }),
      });

      if (resGoal.ok) {
        setToast({ show: true, message: `${formatCurrencyBR(amount)} adicionado à meta!`, type: "success" });
        setAddMoneyModal({ isOpen: false, goalId: null, goalName: "", currentAmount: 0 });
        setAddMoneyForm({ amount: "", account_id: "" });
        fetchGoals();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao adicionar valor", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const url = editingId
        ? `http://localhost:8080/goals/update?id=${editingId}`
        : "http://localhost:8080/goals";
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          target_amount: parseFloat(form.target_amount),
          current_amount: parseFloat(form.current_amount) || 0,
        }),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Meta atualizada!" : "Meta criada!", type: "success" });
        setForm({ name: "", target_amount: "", current_amount: "", deadline: "" });
        setEditingId(null);
        fetchGoals();
      } else {
        setToast({ show: true, message: "Erro ao criar meta", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function deleteGoal(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/goals/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setToast({ show: true, message: "Meta removida!", type: "success" });
        fetchGoals();
      } else {
        setToast({ show: true, message: "Erro ao remover meta", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, goalId: null, goalName: "" });
  }

  useEffect(() => {
    fetchGoals();
    fetchAccounts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Metas Financeiras" 
        subtitle="Acompanhe seus objetivos"
        description="Defina e acompanhe suas metas financeiras. Estabeleça objetivos de curto e longo prazo, como economizar para férias, comprar uma casa ou aumentar sua reserva de emergência. Acompanhe o progresso em tempo real e veja quanto falta para atingir cada meta."
        colorClass="from-purple-600 to-pink-600"
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form - Criar Meta */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MdAttachMoney className="text-purple-400" /> 
            {editingId ? "Editar Meta" : "Nova Meta"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome da meta</label>
              <input
                type="text"
                placeholder="Ex: Viagem 2024"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-purple-400 focus:outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Valor objetivo</label>
              <CurrencyInput
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-purple-400 focus:outline-none"
                value={form.target_amount}
                onChange={(val) => setForm({ ...form, target_amount: val })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Valor atual</label>
              <CurrencyInput
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-purple-400 focus:outline-none"
                value={form.current_amount}
                onChange={(val) => setForm({ ...form, current_amount: val })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Prazo</label>
              <div className="relative">
                <DatePicker
                  selected={form.deadline ? new Date(form.deadline) : null}
                  onChange={(date) => {
                    if (date) {
                      const dateStr = date.toISOString().split('T')[0];
                      setForm({ ...form, deadline: dateStr });
                    }
                  }}
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  placeholderText="Selecione a data"
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-purple-400 focus:outline-none"
                  wrapperClassName="w-full"
                />
                <HiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                {editingId ? "Salvar" : "+ Criar Meta"}
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

        {/* Goals List */}
        <div className="md:col-span-2">
          {goals.length > 0 ? (
            <div className="grid gap-4">
              {goals.map((goal) => {
                const progress = Math.min(goal.progress || 0, 100);
                const daysLeft = goal.deadline
                  ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <div key={goal.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white">{goal.name}</h3>
                        {goal.deadline && (
                          <p className={`text-sm mt-1 flex items-center gap-1 ${daysLeft < 0 ? "text-red-400" : "text-gray-400"}`}>
                            <HiCalendar className="text-base" />
                            {daysLeft < 0
                              ? `Prazo vencido há ${Math.abs(daysLeft)} dias`
                              : daysLeft === 0
                              ? `Prazo hoje!`
                              : `${daysLeft} dias restantes`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openAddMoney(goal)}
                          className="text-emerald-400 hover:text-emerald-300 transition duration-200 flex items-center gap-1"
                          title="Adicionar dinheiro"
                        >
                          <HiPlus className="text-lg" />
                        </button>
                        <button
                          onClick={() => startEdit(goal)}
                          className="text-slate-400 hover:text-slate-300 transition duration-200 flex items-center gap-1"
                          title="Editar meta"
                        >
                          <HiPencil className="text-lg" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, goalId: goal.id, goalName: goal.name })}
                          className="text-red-400 hover:text-red-300 transition duration-200 flex items-center gap-1"
                          title="Excluir meta"
                        >
                          <HiTrash className="text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">{formatCurrencyBR(goal.current_amount)} de {formatCurrencyBR(goal.target_amount)}</span>
                        <span className="text-lg font-bold text-slate-300">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress >= 100 ? "bg-emerald-500" : 
                            progress >= 50 ? "bg-yellow-500" : 
                            "bg-purple-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Amount Remaining */}
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Faltam</p>
                      <p className="text-2xl font-bold text-slate-300">
                        {formatCurrencyBR(Math.max(0, goal.target_amount - goal.current_amount))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg">Nenhuma meta cadastrada</p>
              <p className="text-gray-500 text-sm mt-2">Crie sua primeira meta ao lado!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal - Adicionar Dinheiro */}
      {addMoneyModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Adicionar à Meta</h3>
            <p className="text-gray-300 mb-4">{addMoneyModal.goalName}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Valor a adicionar</label>
                <CurrencyInput
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-purple-400 focus:outline-none"
                  value={addMoneyForm.amount}
                  onChange={(val) => setAddMoneyForm({ ...addMoneyForm, amount: val })}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Conta de origem</label>
                <select
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-purple-400 focus:outline-none"
                  value={addMoneyForm.account_id}
                  onChange={(e) => setAddMoneyForm({ ...addMoneyForm, account_id: e.target.value })}
                >
                  <option value="">Selecione a conta</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - {formatCurrencyBR(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddMoney}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setAddMoneyModal({ isOpen: false, goalId: null, goalName: "", currentAmount: 0 });
                  setAddMoneyForm({ amount: "", account_id: "" });
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Meta"
        message={`Tem certeza que deseja excluir a meta "${deleteModal.goalName}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteGoal(deleteModal.goalId)}
        onCancel={() => setDeleteModal({ isOpen: false, goalId: null, goalName: "" })}
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
