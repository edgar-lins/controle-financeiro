import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { formatCurrencyBR } from "./utils/format";
import { CurrencyInput } from "./components/CurrencyInput";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import API_URL from "./config/api";

// Função para tentar estilizar o cartão baseado no nome do banco
function getAccountBrand(name, type) {
  const n = name.toLowerCase();
  if (n.includes("nu") || n.includes("roxinho")) return { bg: "bg-[#8A05BE]", icon: "Nu", isIcon: false, textColor: "text-white" };
  if (n.includes("ita") || n.includes("itau")) return { bg: "bg-[#EC7000]", icon: "I", isIcon: false, textColor: "text-white" };
  if (n.includes("inter")) return { bg: "bg-[#FF7A00]", icon: "In", isIcon: false, textColor: "text-white" };
  if (n.includes("bradesco")) return { bg: "bg-[#CC092F]", icon: "B", isIcon: false, textColor: "text-white" };
  if (n.includes("santander")) return { bg: "bg-[#CC0000]", icon: "S", isIcon: false, textColor: "text-white" };
  if (n.includes("bb") || n.includes("brasil")) return { bg: "bg-[#F9D300]", icon: "BB", isIcon: false, textColor: "text-blue-900" };
  if (n.includes("c6")) return { bg: "bg-[#242424]", icon: "C6", isIcon: false, textColor: "text-white" };
  if (n.includes("caixa")) return { bg: "bg-[#005CA9]", icon: "CX", isIcon: false, textColor: "text-white" };
  if (n.includes("xp")) return { bg: "bg-[#000000]", icon: "XP", isIcon: false, textColor: "text-yellow-400" };
  
  // Defaults baseados no tipo
  if (type === "dinheiro" || n.includes("carteira") || n.includes("espécie")) return { bg: "bg-surface-container-highest", icon: "payments", isIcon: true, textColor: "text-primary" };
  if (type === "investimento") return { bg: "bg-surface-container-highest", icon: "trending_up", isIcon: true, textColor: "text-tertiary-container" };
  
  return { bg: "bg-surface-container-highest", icon: "account_balance", isIcon: true, textColor: "text-secondary" };
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });

  const { refreshSummary } = useSummary();

  const [form, setForm] = useState({
    name: "", type: "corrente", balance: "",
  });

  const [transferForm, setTransferForm] = useState({
    from_account_id: "", to_account_id: "", amount: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL || "http://localhost:8080"}/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_URL || "http://localhost:8080"}/accounts/update?id=${editingId}` : `${API_URL || "http://localhost:8080"}/accounts`;
      
      const payload = {
        name: form.name,
        type: form.type,
      };

      if (editingId) {
        payload.balance = parseFloat(form.balance);
      } else {
        payload.opening_balance = parseFloat(form.balance) || 0;
        payload.balance = parseFloat(form.balance) || 0;
      }

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Conta atualizada!" : "Conta criada!", type: "success" });
        closeModal();
        refreshSummary();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao salvar", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    if (transferForm.from_account_id === transferForm.to_account_id) {
      setToast({ show: true, message: "As contas devem ser diferentes", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL || "http://localhost:8080"}/accounts/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          from_account_id: parseInt(transferForm.from_account_id),
          to_account_id: parseInt(transferForm.to_account_id),
          amount: parseFloat(transferForm.amount),
        }),
      });

      if (res.ok) {
        setToast({ show: true, message: "Transferência realizada com sucesso!", type: "success" });
        closeTransferModal();
        refreshSummary();
        fetchAccounts();
      } else {
        const errorData = await res.json();
        setToast({ show: true, message: errorData.error || "Erro na transferência", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function deleteAccount(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL || "http://localhost:8080"}/accounts/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: "Conta removida!", type: "success" });
        refreshSummary();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao excluir conta", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, id: null, name: "" });
  }

  function openModal(account = null) {
    if (account) {
      setEditingId(account.id);
      setForm({ name: account.name, type: account.type, balance: account.balance.toString() });
    } else {
      setEditingId(null);
      setForm({ name: "", type: "corrente", balance: "" });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  function openTransferModal(toAccountId = "") {
    setTransferForm({ from_account_id: "", to_account_id: toAccountId ? String(toAccountId) : "", amount: "" });
    setIsTransferModalOpen(true);
  }

  function closeTransferModal() {
    setIsTransferModalOpen(false);
  }

  const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">Minhas Contas</h2>
          <p className="text-secondary/60 font-medium">Gerencie suas conexões bancárias e carteiras físicas.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openTransferModal} className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-full font-bold transition-transform active:scale-95 border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-lg">sync_alt</span>
            <span className="text-sm">Transferir</span>
          </button>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-full font-bold transition-transform hover:scale-105 active:scale-95 shadow-[0_12px_24px_-8px_rgba(90,240,179,0.4)]">
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="text-sm">Nova Conta</span>
          </button>
        </div>
      </header>

      {/* Summary Section (Bento Inspired) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        <div className="col-span-1 lg:col-span-8 bg-[rgba(45,52,73,0.4)] backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
          <div className="relative z-10">
            <p className="text-secondary/60 text-sm font-label tracking-widest uppercase mb-1">Patrimônio Total</p>
            <h3 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-on-surface mb-4">
              {formatCurrencyBR(totalNetWorth)}
            </h3>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-primary text-sm font-bold bg-primary/10 px-3 py-1 rounded-full">
                <span className="material-symbols-outlined text-sm">account_balance</span>
                {accounts.length} Contas Ativas
              </span>
            </div>
          </div>
        </div>

        {/* Action Teaser */}
        <div className="col-span-1 lg:col-span-4 bg-[rgba(45,52,73,0.4)] backdrop-blur-xl p-8 rounded-3xl border border-outline-variant/10 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-secondary/60 text-sm font-label tracking-widest uppercase mb-2">Movimentação</p>
            <h4 className="text-xl font-bold font-headline text-white mb-2">Transferência Rápida</h4>
            <p className="text-secondary/60 text-xs leading-relaxed">Mova o saldo entre suas contas sem gerar uma nova despesa ou receita.</p>
          </div>
          <button onClick={openTransferModal} className="relative z-10 w-full mt-6 bg-surface-container-highest hover:bg-primary/20 text-primary transition-colors py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-primary/20">
            Fazer Transferência <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* Accounts Grid */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-headline text-white">Instituições Conectadas</h3>
        </div>
        
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {accounts.map((acc) => {
              const brand = getAccountBrand(acc.name, acc.type);
              
              return acc.type === "cartao" ? (
                  <div key={acc.id} className="bg-surface-container-low/60 backdrop-blur-md p-6 rounded-3xl border border-purple-500/20 hover:border-purple-400/50 transition-all duration-300 group shadow-lg hover:shadow-[0_8px_32px_rgba(168,85,247,0.15)] flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl ${brand.bg} flex items-center justify-center ${brand.textColor} font-bold text-lg shadow-inner ring-1 ring-white/10`}>
                        {brand.isIcon ? <span className="material-symbols-outlined">{brand.icon}</span> : brand.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded-full">
                        Crédito
                      </span>
                    </div>
                    <p className="text-secondary/80 text-xs font-medium mb-1 truncate">{acc.name}</p>
                    <p className="text-secondary/50 text-[10px] mb-3">Gastos no crédito não debitam seu saldo. Pague a fatura para liquidar.</p>
                    <div className="mt-auto flex gap-2">
                      <button
                        onClick={() => openTransferModal(acc.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">payments</span> Pagar Fatura
                      </button>
                      <button
                        onClick={() => openModal(acc)}
                        className="px-3 py-2 rounded-xl text-xs font-bold bg-surface-container-highest hover:bg-surface-container-high text-secondary hover:text-white border border-outline-variant/10 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                  </div>
                ) : (
                <div key={acc.id} onClick={() => openModal(acc)} className="bg-surface-container-low/60 backdrop-blur-md p-6 rounded-3xl border border-outline-variant/10 hover:border-primary/40 transition-all duration-300 group cursor-pointer shadow-lg hover:shadow-[0_8px_32px_rgba(90,240,179,0.1)]">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl ${brand.bg} flex items-center justify-center ${brand.textColor} font-bold text-lg shadow-inner ring-1 ring-white/10`}>
                      {brand.isIcon ? (
                        <span className="material-symbols-outlined">{brand.icon}</span>
                      ) : (
                        brand.icon
                      )}
                    </div>
                  </div>
                  <p className="text-secondary/80 text-xs font-medium mb-1 truncate">{acc.name} • <span className="capitalize">{acc.type}</span></p>
                  <h4 className={`text-xl font-bold mb-4 truncate ${acc.balance < 0 ? 'text-error' : 'text-primary'}`}>
                    {formatCurrencyBR(acc.balance)}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-secondary/60 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">edit</span> Editar
                    </span>
                    <span className="material-symbols-outlined text-sm group-hover:translate-x-1 group-hover:text-primary transition-all">arrow_forward</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 bg-surface-container-low/30 rounded-3xl border border-dashed border-outline-variant/20 text-center">
            <span className="material-symbols-outlined text-5xl text-secondary/30 mb-3">account_balance</span>
            <p className="text-secondary font-medium">Nenhuma conta cadastrada</p>
            <p className="text-secondary/60 text-sm mt-1">Cadastre sua primeira conta para começar.</p>
          </div>
        )}
      </section>

      {/* Lista Detalhada (Ações rápidas) */}
      {accounts.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-headline text-white">Gerenciar Contas</h3>
          </div>
          <div className="bg-surface-container-low/60 backdrop-blur-md rounded-3xl overflow-hidden border border-outline-variant/10 shadow-xl overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-highest/30 text-[10px] font-label tracking-widest uppercase text-secondary/60 border-b border-outline-variant/5">
                  <th className="px-8 py-5">Conta</th>
                  <th className="px-8 py-5">Tipo</th>
                  <th className="px-8 py-5 text-right">Saldo</th>
                  <th className="px-8 py-5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {accounts.map(acc => {
                  const brand = getAccountBrand(acc.name, acc.type);
                  return (
                    <tr key={`list-${acc.id}`} className="hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-8 py-5 flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg ${brand.bg} flex items-center justify-center text-[10px] ${brand.textColor} font-bold ring-1 ring-white/5 flex-shrink-0`}>
                          {brand.isIcon ? <span className="material-symbols-outlined text-sm">{brand.icon}</span> : brand.icon}
                        </div>
                        <p className="font-bold text-sm text-white truncate max-w-[200px]">{acc.name}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs text-secondary/80 font-medium bg-surface-variant px-3 py-1 rounded-full capitalize">
                          {acc.type}
                        </span>
                      </td>
                      <td className={`px-8 py-5 text-right font-headline font-bold ${acc.balance < 0 ? 'text-error' : 'text-on-surface'}`}>
                        {formatCurrencyBR(acc.balance)}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openModal(acc)} className="p-2 hover:bg-surface-bright rounded-xl text-secondary hover:text-primary transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button onClick={() => setDeleteModal({ isOpen: true, id: acc.id, name: acc.name })} className="p-2 hover:bg-error-container/20 rounded-xl text-secondary hover:text-red-400 transition-colors" title="Excluir">
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Modal Glassmorphism - Adicionar/Editar Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-[2rem] w-full max-w-lg p-6 md:p-8 animate-fade-in">
            <h3 className="font-headline text-2xl font-bold text-white mb-6">
              {editingId ? "Editar Conta" : "Nova Conta"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Nome da Conta / Instituição</label>
                <input required type="text" placeholder="Ex: Nubank, Carteira..." className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Tipo de Conta</label>
                <div className="relative">
                  <select required className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all appearance-none" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="corrente" className="bg-surface">Conta Corrente</option>
                    <option value="poupanca" className="bg-surface">Poupança</option>
                    <option value="cartao" className="bg-surface">Cartão de Crédito</option>
                    <option value="investimento" className="bg-surface">Investimentos</option>
                    <option value="dinheiro" className="bg-surface">Dinheiro / Carteira</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">
                  {editingId ? "Ajustar Saldo Atual" : "Saldo Inicial"} (R$)
                </label>
                <CurrencyInput className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-primary font-headline font-bold text-xl rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.balance} onChange={(val) => setForm({ ...form, balance: val })} />
                <p className="text-[10px] text-secondary mt-1 ml-1">
                  {editingId ? "O ajuste manual de saldo não cria uma transação no histórico." : "Este valor será o ponto de partida desta conta."}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 rounded-xl font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary-container shadow-[0_4px_15px_rgba(90,240,179,0.3)] transition-all active:scale-95">{editingId ? "Salvar" : "Confirmar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Glassmorphism - Transferência */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={closeTransferModal}></div>
          <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-[2rem] w-full max-w-lg p-6 md:p-8 animate-fade-in">
            <h3 className="font-headline text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">sync_alt</span> Transferência
            </h3>
            <p className="text-sm text-secondary/80 mb-6">Mova dinheiro entre suas contas sem alterar seu patrimônio ou seus relatórios de gastos/rendas.</p>
            
            <form onSubmit={handleTransfer} className="space-y-5">
              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Valor da Transferência (R$)</label>
                <CurrencyInput className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-on-surface font-headline font-bold text-xl rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={transferForm.amount} onChange={(val) => setTransferForm({ ...transferForm, amount: val })} required />
              </div>

              <div className="bg-surface-container-highest/20 p-4 rounded-2xl border border-outline-variant/5 space-y-4">
                <div>
                  <label className="block text-[10px] text-error font-bold uppercase tracking-wider mb-1 ml-1">Retirar de (Origem)</label>
                  <div className="relative">
                    <select required className="w-full bg-surface-container-highest/60 border border-outline-variant/10 text-white rounded-xl p-3 focus:border-error outline-none transition-all appearance-none" value={transferForm.from_account_id} onChange={(e) => setTransferForm({ ...transferForm, from_account_id: e.target.value })}>
                      <option value="" className="bg-surface">Selecione a conta...</option>
                      {accounts.map((acc) => (<option key={acc.id} value={acc.id} className="bg-surface">{acc.name} ({formatCurrencyBR(acc.balance)})</option>))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="flex justify-center -my-3 relative z-10">
                  <div className="bg-surface-container-highest rounded-full p-1 border border-outline-variant/10">
                    <span className="material-symbols-outlined text-secondary text-sm">arrow_downward</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-primary font-bold uppercase tracking-wider mb-1 ml-1">Enviar para (Destino)</label>
                  <div className="relative">
                    <select required className="w-full bg-surface-container-highest/60 border border-outline-variant/10 text-white rounded-xl p-3 focus:border-primary outline-none transition-all appearance-none" value={transferForm.to_account_id} onChange={(e) => setTransferForm({ ...transferForm, to_account_id: e.target.value })}>
                      <option value="" className="bg-surface">Selecione a conta...</option>
                      {accounts.map((acc) => (<option key={acc.id} value={acc.id} className="bg-surface">{acc.name} ({formatCurrencyBR(acc.balance)})</option>))}
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeTransferModal} className="flex-1 py-3.5 rounded-xl font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold text-surface bg-on-surface hover:bg-white shadow-lg transition-all active:scale-95">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={deleteModal.isOpen} title="Excluir Conta" message={`Atenção! Ao excluir a conta "${deleteModal.name}", TODAS as transações vinculadas a ela ficarão sem conta (órfãs) e seu patrimônio total será reduzido. Deseja mesmo continuar?`} onConfirm={() => deleteAccount(deleteModal.id)} onCancel={() => setDeleteModal({ isOpen: false, id: null, name: "" })} confirmText="Excluir Conta" isDangerous={true} />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}