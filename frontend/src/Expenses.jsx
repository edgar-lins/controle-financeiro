import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSummary } from "./SummaryContext";
import { formatCurrencyBR } from "./utils/format";
import { CurrencyInput } from "./components/CurrencyInput";
import { CategorySelect, CATEGORIES } from "./components/CategorySelect";
import { Toast } from "./components/Toast";
import { PeriodSelector } from "./components/PeriodSelector";
import API_URL from "./config/api";
import { useAccounts } from "./hooks/useAccounts";
import { PAYMENT_METHODS } from "./constants";

export default function Expenses() {
  const location = useLocation();
  const incomingState = location.state;

  const now = new Date();
  const defaultMonth = incomingState?.month || String(now.getMonth() + 1);
  const defaultYear = incomingState?.year || String(now.getFullYear());

  const [expenses, setExpenses] = useState([]);
  const [accounts, fetchAccounts] = useAccounts();
  const [filterMonth, setFilterMonth] = useState(defaultMonth);
  const [filterYear, setFilterYear] = useState(defaultYear);
  const [showAll, setShowAll] = useState(false);
  const [highlightId, setHighlightId] = useState(incomingState?.highlightId || null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, desc: "", groupId: null, installmentTotal: 1 });
  const [installmentExpenses, setInstallmentExpenses] = useState([]);

  const { refreshSummary } = useSummary();

  const [form, setForm] = useState({
    description: "", amount: "", category: "", group: "", payment_method: "", date: "", account_id: "", installments: "1",
  });

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
    fetchInstallments();
  }, [filterMonth, filterYear, showAll]);

  useEffect(() => {
    if (!highlightId || expenses.length === 0) return;
    const el = document.getElementById(`expense-row-${highlightId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(timer);
  }, [expenses, highlightId]);

  async function fetchExpenses() {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (!showAll) {
        if (filterMonth) params.set("month", String(filterMonth));
        if (filterYear) params.set("year", String(filterYear));
      }
      const res = await fetch(`${API_URL}/expenses${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setToast({ show: true, message: "Erro ao carregar gastos", type: "error" });
    }
  }

  async function fetchInstallments() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/expenses?all_installments=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInstallmentExpenses(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.account_id) {
      setToast({ show: true, message: "A Conta é obrigatória!", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_URL}/expenses/update?id=${editingId}` : `${API_URL}/expenses`;
      const payloadDate = form.date || new Date().toISOString().split("T")[0];
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          date: payloadDate,
          account_id: parseInt(form.account_id),
          installments: editingId ? 1 : (parseInt(form.installments) || 1),
        }),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Gasto atualizado!" : "Gasto registrado!", type: "success" });
        closeModal();
        refreshSummary();
        fetchExpenses();
        fetchInstallments();
      } else {
        setToast({ show: true, message: "Erro ao salvar", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function deleteExpense(id, deleteGroup = false) {
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/expenses/delete?id=${id}${deleteGroup ? "&delete_group=true" : ""}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: deleteGroup ? "Parcelamento cancelado!" : "Gasto removido!", type: "success" });
        refreshSummary();
        fetchExpenses();
        fetchInstallments();
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, id: null, desc: "", groupId: null, installmentTotal: 1 });
  }

  function openModal(expense = null) {
    if (expense) {
      setEditingId(expense.id);
      const dateStr = expense.date ? expense.date.split('T')[0] : "";
      setForm({
        description: expense.description, amount: expense.amount.toString(), category: expense.category || "", group: expense.group || "", payment_method: expense.payment_method || "", date: dateStr, account_id: expense.account_id ? expense.account_id.toString() : "", installments: "1",
      });
    } else {
      setEditingId(null);
      setForm({ description: "", amount: "", category: "", group: "", payment_method: "", date: new Date().toISOString().split("T")[0], account_id: "", installments: "1" });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">Gastos</h2>
          <div className="flex gap-8 mt-4">
            <div className="flex flex-col">
              <span className="text-secondary text-xs uppercase tracking-widest font-semibold mb-1 opacity-60">Total Saídas</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary-container text-sm">trending_down</span>
                <span className="text-tertiary-container font-headline text-2xl font-bold">{formatCurrencyBR(totalExpenses)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-high/40 backdrop-blur px-5 py-2.5 rounded-full flex items-center gap-2 text-on-surface hover:bg-surface-container-high transition-colors border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-lg">description</span>
            <span className="font-label font-semibold text-sm">Exportar CSV</span>
          </button>
          <button onClick={() => alert("Assine o plano PRO para desbloquear relatórios em PDF!")} className="bg-surface-container-high/20 backdrop-blur px-5 py-2.5 rounded-full flex items-center gap-2 text-secondary/60 hover:text-tertiary-container transition-colors border border-outline-variant/10 cursor-pointer">
            <span className="material-symbols-outlined text-lg">lock</span>
            <span className="font-label font-semibold text-sm">Exportar PDF (PRO)</span>
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 md:items-end">
        <div>
          <PeriodSelector
            month={filterMonth}
            year={filterYear}
            onChange={({ month, year }) => {
              setFilterMonth(month);
              setFilterYear(year);
            }}
            disabled={showAll}
          />
        </div>
        <div className="flex items-end mb-1">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showAll ? 'bg-primary' : 'bg-surface-container-highest'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showAll ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className="text-sm font-bold text-secondary group-hover:text-white transition-colors">Ver todo o histórico</span>
          </label>
        </div>
      </section>

      <section className="bg-surface-container-low/60 backdrop-blur-md rounded-3xl overflow-hidden border border-outline-variant/10 shadow-xl">
        <div className="px-6 md:px-8 py-6 flex justify-between items-center border-b border-outline-variant/10">
          <h3 className="font-headline font-bold text-lg text-white">Histórico de Gastos</h3>
          <button onClick={() => openModal()} className="hidden md:flex bg-primary text-on-primary font-bold py-2 px-4 rounded-full items-center gap-1 shadow-[0_0_15px_rgba(90,240,179,0.2)] hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-sm">add</span> Adicionar Gasto
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {expenses.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-secondary/50 text-[10px] font-bold uppercase tracking-widest border-b border-outline-variant/5">
                  <th className="px-6 md:px-8 py-4 whitespace-nowrap">Categoria</th>
                  <th className="px-6 md:px-8 py-4">Descrição</th>
                  <th className="px-6 md:px-8 py-4 whitespace-nowrap">Data</th>
                  <th className="px-6 md:px-8 py-4 text-right whitespace-nowrap">Valor</th>
                  <th className="px-6 md:px-8 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {expenses.map((exp) => {
                  const accountName = accounts.find(a => a.id === exp.account_id)?.name || "Sem conta";
                  const dateObj = new Date(exp.date);
                  dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                  const dateStr = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                  
                  const catDef = CATEGORIES.find(c => c.value === exp.category);
                  const CatIcon = catDef?.icon;

                  return (
                    <tr
                      key={exp.id}
                      id={`expense-row-${exp.id}`}
                      className={`group transition-all duration-700 ${highlightId === exp.id ? 'bg-primary/10 outline outline-1 outline-primary/40 rounded-xl' : 'hover:bg-surface-container-high/40'}`}
                    >
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            {CatIcon
                              ? <CatIcon className="text-xl text-primary" />
                              : <span className="material-symbols-outlined text-xl text-primary">shopping_bag</span>
                            }
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white whitespace-nowrap">{exp.category || "Diversos"}</span>
                            <span className="text-[10px] text-secondary md:hidden">{accountName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <p className="text-sm text-on-surface font-medium">{exp.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-secondary hidden md:block">{accountName}</p>
                          {exp.installment_total > 1 && (
                            <span className="text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                              {exp.installment_number}/{exp.installment_total}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5 text-xs text-secondary font-medium whitespace-nowrap">{dateStr}</td>
                      <td className="px-6 md:px-8 py-5 text-right font-headline font-bold text-tertiary-container whitespace-nowrap">- {formatCurrencyBR(exp.amount)}</td>
                      <td className="px-6 md:px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openModal(exp)} className="p-2 text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">edit</span></button>
                          <button onClick={() => setDeleteModal({ isOpen: true, id: exp.id, desc: exp.description, groupId: exp.installment_group_id, installmentTotal: exp.installment_total })} className="p-2 text-secondary hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
              <p>Nenhum gasto encontrado neste período.</p>
            </div>
          )}
        </div>
      </section>

      {/* FAB Mobile Only */}
      <button onClick={() => openModal()} className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_8px_32px_rgba(90,240,179,0.4)] flex items-center justify-center active:scale-90 transition-transform z-50">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-[2rem] w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto no-scrollbar">

            {/* Header */}
            <div className="flex items-center justify-between px-6 md:px-8 pt-6 md:pt-8 pb-4 border-b border-white/5">
              <h3 className="font-headline text-xl font-bold text-white">
                {editingId ? "Editar Gasto" : "Novo Gasto"}
              </h3>
              <button type="button" onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Corpo em duas colunas no desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-white/5">

                {/* Coluna esquerda — campos básicos */}
                <div className="px-6 md:px-8 py-6 space-y-4">
                  <div>
                    <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Descrição</label>
                    <input required type="text" placeholder="Ex: Supermercado" className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Valor (R$)</label>
                    <CurrencyInput className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-tertiary-container font-headline font-bold text-xl rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.amount} onChange={(val) => setForm({ ...form, amount: val })} required />
                  </div>

                  <div>
                    <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Data</label>
                    <input required type="date" className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all [color-scheme:dark]" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>

                  <div>
                    <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Conta</label>
                    <div className="relative">
                      <select required className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all appearance-none" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                        <option value="" className="bg-surface">Selecione...</option>
                        {accounts.map((acc) => (<option key={acc.id} value={acc.id} className="bg-surface">{acc.name}</option>))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                    </div>
                    {form.account_id && accounts.find(a => String(a.id) === String(form.account_id))?.type === "cartao" && (
                      <div className="mt-2 flex items-start gap-2 bg-purple-500/10 border border-purple-500/20 rounded-xl px-3 py-2.5">
                        <span className="material-symbols-outlined text-purple-400 text-sm mt-0.5 flex-shrink-0">info</span>
                        <p className="text-[11px] text-purple-300 leading-relaxed">
                          Gasto no crédito — o valor entra no seu orçamento do mês, mas o débito real só acontece quando você pagar a fatura.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Método de Pagamento</label>
                    <div className="relative">
                      <select className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all appearance-none" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value, installments: "1" })}>
                        <option value="" className="bg-surface">Selecione (opcional)</option>
                        {PAYMENT_METHODS.map((pm) => (
                          <option key={pm.value} value={pm.value} className="bg-surface">{pm.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  {form.payment_method === "credito" && !editingId && (
                    <div>
                      <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Parcelamento</label>
                      <div className="relative">
                        <select className="w-full bg-surface-container-highest/40 border border-purple-500/20 text-white rounded-xl p-3.5 focus:border-purple-400 outline-none transition-all appearance-none" value={form.installments} onChange={(e) => setForm({ ...form, installments: e.target.value })}>
                          <option value="1" className="bg-surface">À vista</option>
                          {[2,3,4,5,6,7,8,9,10,11,12].map(n => (
                            <option key={n} value={n} className="bg-surface">{n}x</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
                      </div>
                      {parseInt(form.installments) > 1 && form.amount && (
                        <p className="text-[11px] text-purple-300 mt-1.5 ml-1">
                          {form.installments}x de {formatCurrencyBR(parseFloat(form.amount) / parseInt(form.installments))} — total {formatCurrencyBR(parseFloat(form.amount))}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Coluna direita — categoria */}
                <div className="px-6 md:px-8 py-6 border-t border-white/5 md:border-t-0">
                  <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-3 ml-1">Categoria 50/30/20</label>
                  <CategorySelect value={form.category} group={form.group} onChange={({ category, group }) => setForm({ ...form, category, group })} />
                </div>
              </div>

              {/* Footer com botões */}
              <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 border-t border-white/5 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 rounded-xl font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary-container shadow-[0_4px_15px_rgba(90,240,179,0.3)] transition-all active:scale-95">{editingId ? "Salvar" : "Confirmar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parcelamentos Ativos */}
      {(() => {
        const today = new Date();
        const groups = {};
        installmentExpenses.forEach(exp => {
          const gid = exp.installment_group_id ?? exp.id;
          if (!groups[gid]) groups[gid] = [];
          groups[gid].push(exp);
        });
        const activeGroups = Object.values(groups).filter(g =>
          g.some(e => new Date(e.date) >= today)
        );
        if (activeGroups.length === 0) return null;
        return (
          <section className="space-y-4">
            <h3 className="font-headline font-bold text-xl text-white">Parcelamentos Ativos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGroups.map(group => {
                const sorted = [...group].sort((a, b) => new Date(a.date) - new Date(b.date));
                const first = sorted[0];
                const upcoming = sorted.filter(e => new Date(e.date) >= today);
                const paid = sorted.length - upcoming.length;
                const nextDate = new Date(upcoming[0].date);
                nextDate.setMinutes(nextDate.getMinutes() + nextDate.getTimezoneOffset());
                const nextDateStr = nextDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                const groupId = first.installment_group_id ?? first.id;
                return (
                  <div key={groupId} className="bg-surface-container-low/60 backdrop-blur-md rounded-2xl p-5 border border-purple-500/20 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white font-semibold text-sm">{first.description}</p>
                        <p className="text-secondary/60 text-xs mt-0.5">{first.category || "Diversos"}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20 px-2 py-1 rounded-full flex-shrink-0">
                        {paid}/{first.installment_total} pagas
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-300 font-headline font-bold">{formatCurrencyBR(first.amount)}<span className="text-secondary/60 text-xs font-normal">/mês</span></p>
                        <p className="text-secondary/60 text-xs mt-0.5">Próxima: {nextDateStr}</p>
                      </div>
                      <button
                        onClick={() => setDeleteModal({ isOpen: true, id: upcoming[0].id, desc: first.description, groupId, installmentTotal: first.installment_total })}
                        className="text-xs text-secondary/50 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span> Cancelar
                      </button>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${(paid / first.installment_total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Modal de delete — com opção para parcelas */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, id: null, desc: "", groupId: null, installmentTotal: 1 })} />
          <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-[2rem] w-full max-w-sm p-7 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-400 text-lg">delete</span>
              </div>
              <h3 className="font-headline text-lg font-bold text-white">Excluir gasto</h3>
            </div>
            <p className="text-secondary/80 text-sm mb-5">"{deleteModal.desc}"</p>
            {deleteModal.installmentTotal > 1 ? (
              <div className="flex flex-col gap-3">
                <button onClick={() => deleteExpense(deleteModal.id, false)} className="w-full py-3 rounded-xl font-bold text-white bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 transition-colors text-sm">
                  Excluir só esta parcela
                </button>
                <button onClick={() => deleteExpense(deleteModal.id, true)} className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors text-sm active:scale-95">
                  Cancelar todas as parcelas restantes
                </button>
                <button onClick={() => setDeleteModal({ isOpen: false, id: null, desc: "", groupId: null, installmentTotal: 1 })} className="w-full py-3 rounded-xl font-bold text-secondary text-sm hover:text-white transition-colors">
                  Voltar
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ isOpen: false, id: null, desc: "", groupId: null, installmentTotal: 1 })} className="flex-1 py-3 rounded-xl font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest transition-colors">Cancelar</button>
                <button onClick={() => deleteExpense(deleteModal.id)} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors active:scale-95">Excluir</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}