import { useEffect, useState } from "react";
import { formatCurrencyBR } from "./utils/format";
import { CurrencyInput } from "./components/CurrencyInput";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import API_URL from "./config/api";

// Ícones randômicos para dar um charme nas metas
const goalIcons = ["flight_takeoff", "security", "directions_car", "home_repair_service", "school", "devices", "sports_esports"];

function getRandomIcon(id) {
  return goalIcons[id % goalIcons.length];
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, name: "" });
  
  const [addMoneyModal, setAddMoneyModal] = useState({ isOpen: false, id: null, name: "", currentAmount: 0 });
  const [addMoneyForm, setAddMoneyForm] = useState({ amount: "", account_id: "" });

  const [form, setForm] = useState({
    name: "", target_amount: "", current_amount: "", deadline: "",
  });

  useEffect(() => {
    fetchGoals();
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

  async function fetchGoals() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL || "http://localhost:8080"}/goals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_URL || "http://localhost:8080"}/goals/update?id=${editingId}` : `${API_URL || "http://localhost:8080"}/goals`;
      
      const payload = {
        ...form,
        target_amount: parseFloat(form.target_amount),
        current_amount: parseFloat(form.current_amount) || 0,
      };

      if (!payload.deadline) { delete payload.deadline; }

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Meta atualizada!" : "Meta criada!", type: "success" });
        closeModal();
        fetchGoals();
      } else {
        setToast({ show: true, message: "Erro ao salvar meta", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function handleAddMoney() {
    if (!addMoneyForm.amount || !addMoneyForm.account_id) {
      setToast({ show: true, message: "Preencha o valor e selecione a conta de origem", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const amount = parseFloat(addMoneyForm.amount);

      const res = await fetch(`${API_URL || "http://localhost:8080"}/goals/add-money?id=${addMoneyModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: amount, account_id: parseInt(addMoneyForm.account_id) }),
      });

      if (res.ok) {
        setToast({ show: true, message: `${formatCurrencyBR(amount)} adicionado à meta!`, type: "success" });
        closeAddMoneyModal();
        fetchGoals();
        fetchAccounts();
      } else {
        setToast({ show: true, message: "Erro ao adicionar valor", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function deleteGoal(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL || "http://localhost:8080"}/goals/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: "Meta removida!", type: "success" });
        fetchGoals();
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, id: null, name: "" });
  }

  function openModal(goal = null) {
    if (goal) {
      setEditingId(goal.id);
      const dateStr = goal.deadline ? goal.deadline.split('T')[0] : "";
      setForm({ name: goal.name, target_amount: goal.target_amount.toString(), current_amount: goal.current_amount.toString(), deadline: dateStr });
    } else {
      setEditingId(null);
      setForm({ name: "", target_amount: "", current_amount: "", deadline: "" });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  function openAddMoneyModal(goal) {
    setAddMoneyModal({ isOpen: true, id: goal.id, name: goal.name, currentAmount: goal.current_amount });
    setAddMoneyForm({ amount: "", account_id: "" });
  }

  function closeAddMoneyModal() {
    setAddMoneyModal({ isOpen: false, id: null, name: "", currentAmount: 0 });
    setAddMoneyForm({ amount: "", account_id: "" });
  }

  // Cálculos Gerais
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
  const availableBalance = accounts.reduce((sum, a) => sum + a.balance, 0); // Saldo disponível em contas para alocar

  // Separa metas ativas das concluídas
  const activeGoals = goals.filter(g => g.current_amount < g.target_amount);
  const completedGoals = goals.filter(g => g.current_amount >= g.target_amount);

  return (
    <div className="space-y-12 animate-fade-in relative z-10 pb-10">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <p className="text-primary font-headline font-bold tracking-widest uppercase text-xs mb-2">Finanças Pessoais</p>
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">Minhas Metas</h2>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-primary-container text-on-primary font-bold px-8 py-3 rounded-full flex items-center justify-center gap-2 transition-all shadow-[0_12px_24px_rgba(90,240,179,0.15)] active:scale-95">
          <span className="material-symbols-outlined text-[20px]">add</span> Nova Meta
        </button>
      </header>

      {/* Observatory Summary Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[rgba(19,27,46,0.6)] backdrop-blur-xl rounded-3xl p-8 border border-outline-variant/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div>
              <p className="text-secondary text-sm font-medium mb-1">Total acumulado nas metas</p>
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tighter text-on-surface">{formatCurrencyBR(totalSaved)}</h2>
            </div>
            <div className="h-16 w-px bg-outline-variant/20 hidden md:block"></div>
            <div>
              <p className="text-secondary text-sm font-medium mb-1">Saldo em Contas</p>
              <h2 className="text-3xl font-headline font-bold tracking-tight text-secondary">{formatCurrencyBR(availableBalance)}</h2>
              <p className="text-xs text-secondary/40 mt-1 italic">Disponível para transferir</p>
            </div>
          </div>
        </div>

        <div className="bg-[rgba(19,27,46,0.6)] backdrop-blur-xl rounded-3xl p-8 border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-primary mb-4 text-3xl">speed</span>
            <p className="text-secondary text-sm font-medium">Progresso Geral</p>
          </div>
          <div className="mt-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-headline font-extrabold text-on-surface">{globalProgress.toFixed(0)}%</span>
              <span className="text-secondary text-xs">{formatCurrencyBR(totalTarget)} Alvo Total</span>
            </div>
            <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${Math.min(globalProgress, 100)}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Goals Grid */}
      <section>
        <h3 className="text-xl font-headline font-bold mb-8 text-on-surface flex items-center gap-3">
          <span className="w-8 h-[2px] bg-primary"></span> Metas Ativas
        </h3>

        {activeGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeGoals.map(goal => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100) || 0;
              const dateStr = goal.deadline ? new Date(goal.deadline).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : "Sem Prazo";

              return (
                <div key={goal.id} className="bg-surface-container-low/60 backdrop-blur-md rounded-3xl p-6 flex flex-col transition-all hover:translate-y-[-4px] group border border-outline-variant/10 hover:border-primary/30 shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors shadow-inner">
                        <span className="material-symbols-outlined">{getRandomIcon(goal.id)}</span>
                      </div>
                      <span className="text-secondary/60 text-[10px] font-bold uppercase tracking-widest bg-surface-container-highest px-3 py-1 rounded-full">{dateStr}</span>
                    </div>
                    
                    <h4 className="text-xl font-headline font-bold text-white mb-1 truncate pr-8">{goal.name}</h4>
                    
                    {/* Botões de edição flutuantes */}
                    <div className="absolute top-[68px] right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-container-low/80 pl-2 pb-2 rounded-bl-xl backdrop-blur-sm">
                       <button onClick={() => openModal(goal)} className="text-secondary hover:text-primary p-1"><span className="material-symbols-outlined text-sm">edit</span></button>
                       <button onClick={() => setDeleteModal({ isOpen: true, id: goal.id, name: goal.name })} className="text-secondary hover:text-error p-1"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>

                    <div className="space-y-4 mb-8 mt-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary font-medium">{formatCurrencyBR(goal.current_amount)}</span>
                        <span className="text-on-surface font-bold">{formatCurrencyBR(goal.target_amount)}</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                      </div>
                      <p className="text-[10px] text-right text-secondary/60 italic">{progress.toFixed(1)}% concluído</p>
                    </div>
                    
                    <button onClick={() => openAddMoneyModal(goal)} className="w-full py-4 bg-surface-container-high hover:bg-primary transition-all text-on-surface hover:text-on-primary font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span> Transferir para Meta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 bg-surface-container-low/30 rounded-3xl border border-dashed border-outline-variant/20 text-center">
            <span className="material-symbols-outlined text-5xl text-secondary/30 mb-3">ads_click</span>
            <p className="text-secondary font-medium">Nenhuma meta em andamento</p>
            <p className="text-secondary/60 text-sm mt-1">Clique em "Nova Meta" para começar a investir nos seus sonhos.</p>
          </div>
        )}
      </section>

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <section className="pt-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-headline font-bold text-on-surface flex items-center gap-3">
              <span className="w-8 h-[2px] bg-secondary/30"></span> Metas Concluídas
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map(goal => (
              <div key={goal.id} className="flex items-center justify-between p-6 bg-surface-container-lowest/40 rounded-2xl border border-outline-variant/10 group hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                  <div>
                    <h5 className="font-bold text-on-surface text-lg truncate max-w-[150px] sm:max-w-[200px]">{goal.name}</h5>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => openModal(goal)} className="text-[10px] text-secondary hover:text-primary transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">edit</span> Editar</button>
                      <button onClick={() => setDeleteModal({ isOpen: true, id: goal.id, name: goal.name })} className="text-[10px] text-secondary hover:text-error transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">delete</span> Excluir</button>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-lg">{formatCurrencyBR(goal.target_amount)}</p>
                  <p className="text-[10px] text-secondary/60 font-bold uppercase tracking-widest mt-1 bg-surface-container-high px-2 py-0.5 rounded inline-block">100% Atingido</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal - Nova/Editar Meta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-[2rem] w-full max-w-lg p-6 md:p-8 animate-fade-in max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="font-headline text-2xl font-bold text-white mb-6">
              {editingId ? "Editar Meta" : "Nova Meta"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">O que você quer alcançar?</label>
                <input required type="text" placeholder="Ex: Viagem, Carro Novo..." className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Valor Alvo (R$)</label>
                <CurrencyInput className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-primary font-headline font-bold text-xl rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.target_amount} onChange={(val) => setForm({ ...form, target_amount: val })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Já tem algo guardado?</label>
                  <CurrencyInput className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all" value={form.current_amount} onChange={(val) => setForm({ ...form, current_amount: val })} />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Prazo (Opcional)</label>
                  <input type="date" className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all [color-scheme:dark]" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 rounded-xl font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary-container shadow-[0_4px_15px_rgba(90,240,179,0.3)] transition-all active:scale-95">{editingId ? "Salvar" : "Confirmar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Adicionar Dinheiro */}
      {addMoneyModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={closeAddMoneyModal}></div>
          <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-[2rem] w-full max-w-lg p-6 md:p-8 animate-fade-in">
            <h3 className="font-headline text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_balance_wallet</span> Investir na Meta
            </h3>
            <p className="text-sm text-secondary/80 mb-6 border-b border-outline-variant/10 pb-4">
              Destino: <span className="text-white font-bold">{addMoneyModal.name}</span>
            </p>
            
            <form className="space-y-5">
              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Valor a transferir (R$)</label>
                <CurrencyInput className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-primary font-headline font-bold text-xl rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={addMoneyForm.amount} onChange={(val) => setAddMoneyForm({ ...addMoneyForm, amount: val })} required autoFocus />
              </div>

              <div>
                <label className="block text-[10px] text-error font-bold uppercase tracking-wider mb-1 ml-1">Retirar o dinheiro de qual conta?</label>
                <div className="relative">
                  <select required className="w-full bg-surface-container-highest/60 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-error outline-none transition-all appearance-none" value={addMoneyForm.account_id} onChange={(e) => setAddMoneyForm({ ...addMoneyForm, account_id: e.target.value })}>
                    <option value="" className="bg-surface">Selecione a conta...</option>
                    {accounts.map((acc) => (<option key={acc.id} value={acc.id} className="bg-surface">{acc.name} ({formatCurrencyBR(acc.balance)})</option>))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeAddMoneyModal} className="flex-1 py-3.5 rounded-xl font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancelar</button>
                <button type="button" onClick={handleAddMoney} className="flex-1 py-3.5 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary-container shadow-[0_4px_15px_rgba(90,240,179,0.3)] transition-all active:scale-95">Transferir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={deleteModal.isOpen} title="Excluir Meta" message={`Deseja desistir da meta "${deleteModal.name}"? O dinheiro registrado nela não voltará automaticamente para suas contas.`} onConfirm={() => deleteGoal(deleteModal.id)} onCancel={() => setDeleteModal({ isOpen: false, id: null, name: "" })} confirmText="Sim, excluir" isDangerous={true} />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}