import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSummary } from "./SummaryContext";
import { formatCurrencyBR } from "./utils/format";
import { CurrencyInput } from "./components/CurrencyInput";
import { CategorySelect, CATEGORIES } from "./components/CategorySelect";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import { PeriodSelector } from "./components/PeriodSelector";
import API_URL from "./config/api";

const paymentOptions = [
  { value: "pix", label: "Pix", icon: "bolt" },
  { value: "debito", label: "Débito", icon: "credit_card" },
  { value: "credito", label: "Crédito", icon: "credit_card" },
  { value: "dinheiro", label: "Dinheiro", icon: "payments" },
  { value: "boleto", label: "Boleto", icon: "receipt" },
];

export default function Expenses() {
  const location = useLocation();
  const incomingState = location.state;

  const now = new Date();
  const defaultMonth = incomingState?.month || String(now.getMonth() + 1);
  const defaultYear = incomingState?.year || String(now.getFullYear());

  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filterMonth, setFilterMonth] = useState(defaultMonth);
  const [filterYear, setFilterYear] = useState(defaultYear);
  const [showAll, setShowAll] = useState(false);
  const [highlightId, setHighlightId] = useState(incomingState?.highlightId || null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, desc: "" });
  
  const { refreshSummary } = useSummary();

  const [form, setForm] = useState({
    description: "", amount: "", category: "", group: "", payment_method: "", date: "", account_id: "",
  });

  useEffect(() => {
    fetchExpenses();
    fetchAccounts();
  }, [filterMonth, filterYear, showAll]);

  useEffect(() => {
    if (!highlightId || expenses.length === 0) return;
    const el = document.getElementById(`expense-row-${highlightId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => setHighlightId(null), 2500);
    return () => clearTimeout(timer);
  }, [expenses, highlightId]);

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

  async function fetchExpenses() {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (!showAll) {
        if (filterMonth) params.set("month", String(filterMonth));
        if (filterYear) params.set("year", String(filterYear));
      }
      const res = await fetch(`${API_URL || "http://localhost:8080"}/expenses${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar gastos:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.account_id) {
      setToast({ show: true, message: "A Conta é obrigatória!", type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `${API_URL || "http://localhost:8080"}/expenses/update?id=${editingId}` : `${API_URL || "http://localhost:8080"}/expenses`;
      const payloadDate = form.date || new Date().toISOString().split("T")[0];
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          date: payloadDate,
          account_id: parseInt(form.account_id),
        }),
      });

      if (res.ok) {
        setToast({ show: true, message: editingId ? "Gasto atualizado!" : "Gasto registrado!", type: "success" });
        closeModal();
        refreshSummary();
        fetchExpenses();
      } else {
        setToast({ show: true, message: "Erro ao salvar", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function deleteExpense(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL || "http://localhost:8080"}/expenses/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: "Gasto removido!", type: "success" });
        refreshSummary();
        fetchExpenses();
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, id: null, desc: "" });
  }

  function openModal(expense = null) {
    if (expense) {
      setEditingId(expense.id);
      const dateStr = expense.date ? expense.date.split('T')[0] : "";
      setForm({
        description: expense.description, amount: expense.amount.toString(), category: expense.category || "", group: expense.group || "", payment_method: expense.payment_method || "", date: dateStr, account_id: expense.account_id ? expense.account_id.toString() : "",
      });
    } else {
      setEditingId(null);
      setForm({ description: "", amount: "", category: "", group: "", payment_method: "", date: new Date().toISOString().split("T")[0], account_id: "" });
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
                        <p className="text-[11px] text-secondary mt-0.5 hidden md:block">{accountName}</p>
                      </td>
                      <td className="px-6 md:px-8 py-5 text-xs text-secondary font-medium whitespace-nowrap">{dateStr}</td>
                      <td className="px-6 md:px-8 py-5 text-right font-headline font-bold text-tertiary-container whitespace-nowrap">- {formatCurrencyBR(exp.amount)}</td>
                      <td className="px-6 md:px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(exp)} className="p-2 text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">edit</span></button>
                          <button onClick={() => setDeleteModal({ isOpen: true, id: exp.id, desc: exp.description })} className="p-2 text-secondary hover:text-error transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
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
                    <select required className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all appearance-none" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                      <option value="" className="bg-surface">Selecione...</option>
                      {accounts.map((acc) => (<option key={acc.id} value={acc.id} className="bg-surface">{acc.name}</option>))}
                    </select>
                  </div>
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

      <ConfirmModal isOpen={deleteModal.isOpen} title="Excluir Gasto" message={`Deseja excluir "${deleteModal.desc}"?`} onConfirm={() => deleteExpense(deleteModal.id)} onCancel={() => setDeleteModal({ isOpen: false, id: null, desc: "" })} confirmText="Excluir" isDangerous={true} />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}