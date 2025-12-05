import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HiTrash, HiPencil, HiSwitchHorizontal, HiX, HiChevronDown, HiExclamationCircle } from "react-icons/hi";
import { MdAttachMoney } from "react-icons/md";
import { formatCurrencyBR } from "./utils/format";
import { AccountTypeSelect } from "./components/AccountTypeSelect";
import { CurrencyInput } from "./components/CurrencyInput";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import { PageHeader } from "./components/PageHeader";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ name: "", type: "corrente", balance: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, accountId: null, accountName: "" });
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    from_account_id: "",
    to_account_id: "",
    amount: "",
    description: "",
  });

  const accountTypes = {
    corrente: "Conta Corrente",
    poupanca: "Poupança",
    cartao: "Cartão de Crédito",
    investimento: "Investimentos"
  };

  async function fetchAccounts() {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("Contas recebidas do backend:", data);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro:", error);
      setAccounts([]);
    }
  }

  function startEdit(account) {
    console.log("Editando conta:", account);
    setEditingId(account.id);
    setForm({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ name: "", type: "corrente", balance: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const url = editingId 
        ? `${apiUrl}/accounts/update?id=${editingId}`
        : `${apiUrl}/accounts`;
      
      // Normaliza o valor para número, removendo separadores e trocando vírgula por ponto
      const rawBalance = String(form.balance ?? "");
      const normalizedBalance = rawBalance.replace(/\./g, "").replace(",", ".");
      const balance = normalizedBalance === "" || normalizedBalance === "."
        ? 0
        : parseFloat(normalizedBalance);
      const payload = {
        name: form.name,
        type: form.type,
        balance: balance,
      };
      
      console.log("Enviando payload:", payload);
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Conta atualizada!" : "Conta adicionada!", type: "success" });
        setForm({ name: "", type: "corrente", balance: "" });
        setEditingId(null);
        // Refresh accounts list
        setTimeout(() => fetchAccounts(), 200);
      } else {
        setToast({ show: true, message: editingId ? "Erro ao atualizar conta" : "Erro ao adicionar conta", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function deleteAccount(id) {
    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/accounts/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setToast({ show: true, message: "Conta removida!", type: "success" });
        fetchAccounts();
      } else if (res.status === 403) {
        setToast({ show: true, message: "Não é possível deletar a Carteira Geral", type: "error" });
      } else {
        setToast({ show: true, message: "Erro ao remover conta", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, accountId: null, accountName: "" });
  }

  function openTransferFrom(fromId) {
    setTransferForm({ from_account_id: String(fromId), to_account_id: "", amount: "", description: "" });
    setShowTransferModal(true);
  }

  function closeTransferModal() {
    setShowTransferModal(false);
    setTransferForm({ from_account_id: "", to_account_id: "", amount: "", description: "" });
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (!transferForm.amount || Number(transferForm.amount) <= 0) {
      setToast({ show: true, message: "Informe um valor válido", type: "error" });
      return;
    }
    if (transferForm.from_account_id === transferForm.to_account_id) {
      setToast({ show: true, message: "Escolha contas diferentes", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const payload = {
        from_account_id: Number(transferForm.from_account_id),
        to_account_id: Number(transferForm.to_account_id),
        amount: Number(transferForm.amount),
        description: transferForm.description,
      };

      const res = await fetch(`${apiUrl}/accounts/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Erro ao transferir");
      }

      setToast({ show: true, message: "Transferência realizada!", type: "success" });
      setShowTransferModal(false);
      setTransferForm({ from_account_id: "", to_account_id: "", amount: "", description: "" });
      fetchAccounts();
    } catch (error) {
      setToast({ show: true, message: error.message || "Erro ao transferir", type: "error" });
    }
  }

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Minhas Contas" 
        subtitle="Gerencie suas contas"
        description="Gerencie todas as suas contas bancárias, poupanças, contas de investimento e cartões de crédito. Visualize o saldo total e rastreie movimentações em cada conta. Os saldos das contas são utilizados para calcular o resumo financeiro."
        colorClass="from-cyan-600 to-blue-600"
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form - Criar/Editar Conta */}
        <div className="md:col-span-1 md:sticky md:top-6 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <MdAttachMoney className="text-cyan-400" /> 
            {editingId ? "Editar Conta" : "Adicionar Conta"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nome da conta</label>
              <input
                type="text"
                placeholder="Ex: Conta Corrente"
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de conta</label>
              <AccountTypeSelect 
                value={form.type}
                onChange={(type) => setForm({ ...form, type })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Saldo inicial</label>
              <CurrencyInput
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
                value={form.balance}
                onChange={(val) => setForm({ ...form, balance: val })}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                {editingId ? "Salvar" : "+ Adicionar Conta"}
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

        {/* Lista de Contas */}
        <div className="md:col-span-2">
          <div className="mb-6 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-lg p-6 text-white">
            <p className="text-emerald-100 text-sm font-medium">Saldo Total</p>
            <p className="text-4xl font-bold mt-2">{formatCurrencyBR(totalBalance)}</p>
          </div>

          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {accounts.map((acc) => {
                const isNegative = acc.balance < 0;
                return (
                  <div 
                    key={acc.id} 
                    className={`border rounded-xl p-4 shadow-sm hover:shadow-md transition duration-200 ${
                      isNegative
                        ? "bg-red-900/20 border-red-500/60"
                        : "bg-slate-900 border-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div className="flex-1 min-w-[180px]">
                        <h3 className="text-lg font-bold text-white">{acc.name}</h3>
                        <p className="text-sm text-gray-400">{accountTypes[acc.type]}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openTransferFrom(acc.id)}
                          className="text-cyan-400 hover:text-cyan-300 transition duration-200 flex items-center justify-center p-2 min-w-[44px] min-h-[44px]"
                          title="Transferir entre contas"
                        >
                          <HiSwitchHorizontal className="text-xl" />
                        </button>
                        <button
                          onClick={() => startEdit(acc)}
                          className="text-slate-400 hover:text-slate-300 transition duration-200 flex items-center justify-center p-2 min-w-[44px] min-h-[44px]"
                          title="Editar conta"
                        >
                          <HiPencil className="text-xl" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, accountId: acc.id, accountName: acc.name })}
                          disabled={acc.name === "Carteira Geral"}
                          className={`transition duration-200 flex items-center justify-center p-2 min-w-[44px] min-h-[44px] ${
                            acc.name === "Carteira Geral"
                              ? "text-gray-600 cursor-not-allowed opacity-50"
                              : "text-red-400 hover:text-red-300"
                          }`}
                          title={acc.name === "Carteira Geral" ? "Não é possível deletar a Carteira Geral" : "Excluir conta"}
                        >
                          <HiTrash className="text-xl" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className={`text-2xl font-bold ${isNegative ? "text-red-300" : "text-slate-300"}`}>
                        {formatCurrencyBR(acc.balance)}
                      </p>
                      {isNegative && (
                        <p className="text-red-300 text-xs mt-2 flex items-center gap-1"><HiExclamationCircle /> Saldo negativo</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 border-2 border-dashed border-white/20 rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg">Nenhuma conta cadastrada</p>
              <p className="text-gray-500 text-sm mt-2">Crie sua primeira conta no formulário ao lado</p>
            </div>
          )}
        </div>
      </div>

      {showTransferModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            <button
              onClick={closeTransferModal}
              className="absolute top-3 right-3 text-slate-400 hover:text-white"
              aria-label="Fechar"
            >
              <HiX className="text-xl" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <HiSwitchHorizontal className="text-cyan-400 text-2xl" />
              <div>
                <h3 className="text-lg font-bold text-white">Transferir entre contas</h3>
                <p className="text-sm text-slate-300">Movimente saldo entre contas sem registrar receita ou despesa.</p>
              </div>
            </div>
            <form className="space-y-4" onSubmit={handleTransfer}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-200 mb-2">Conta de origem</label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2 pl-3 pr-10 appearance-none focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_0_2px_rgba(34,211,238,0.25)] transition"
                      value={transferForm.from_account_id}
                      onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      {accounts.map((acc) => (
                        <option key={`from-${acc.id}`} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                    <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-200 mb-2">Conta de destino</label>
                  <div className="relative">
                    <select
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2 pl-3 pr-10 appearance-none focus:border-cyan-400 focus:outline-none focus:shadow-[0_0_0_2px_rgba(34,211,238,0.25)] transition"
                      value={transferForm.to_account_id}
                      onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      {accounts.map((acc) => (
                        <option
                          key={`to-${acc.id}`}
                          value={acc.id}
                          disabled={transferForm.from_account_id === String(acc.id)}
                        >
                          {acc.name}
                        </option>
                      ))}
                    </select>
                    <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-200 mb-2">Valor</label>
                  <CurrencyInput
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4 focus:border-cyan-400 focus:outline-none"
                    value={transferForm.amount}
                    onChange={(val) => setTransferForm({ ...transferForm, amount: val })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-200 mb-2">Descrição (opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg py-2.5 px-4"
                    value={transferForm.description}
                    onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                    placeholder="Ex: reserva de emergência"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTransferModal}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow"
                >
                  Transferir
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        title="Excluir Conta"
        message={`Tem certeza que deseja excluir a conta "${deleteModal.accountName}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteAccount(deleteModal.accountId)}
        onCancel={() => setDeleteModal({ isOpen: false, accountId: null, accountName: "" })}
        confirmText="Excluir"
        cancelText="Cancelar"
        isDangerous={true}
      />

      {toast.show && createPortal(
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "success" })}
        />
      , document.body)}
    </div>
  );
}
