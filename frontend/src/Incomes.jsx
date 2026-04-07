import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { formatCurrencyBR } from "./utils/format";
import { CurrencyInput } from "./components/CurrencyInput";
import { ConfirmModal } from "./components/ConfirmModal";
import { Toast } from "./components/Toast";
import { PeriodSelector } from "./components/PeriodSelector";
import API_URL from "./config/api";
import { useAccounts } from "./hooks/useAccounts";

export default function Incomes() {
  const now = new Date();
  const defaultMonth = String(now.getMonth() + 1);
  const defaultYear = String(now.getFullYear());

  const [incomes, setIncomes] = useState([]);
  const [accounts, fetchAccounts] = useAccounts();
  const [filterMonth, setFilterMonth] = useState(defaultMonth);
  const [filterYear, setFilterYear] = useState(defaultYear);
  const [showAll, setShowAll] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, desc: "" });
  
  const { refreshSummary } = useSummary();

  const [form, setForm] = useState({
    description: "", amount: "", date: "", account_id: "",
  });

  useEffect(() => {
    fetchIncomes();
    fetchAccounts();
  }, [filterMonth, filterYear, showAll]);

  async function fetchIncomes() {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (!showAll) {
        if (filterMonth) params.set("month", String(filterMonth));
        if (filterYear) params.set("year", String(filterYear));
      }
      const res = await fetch(`${API_URL}/incomes${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setIncomes(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({ show: true, message: "Erro ao carregar rendas", type: "error" });
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
      const url = editingId ? `${API_URL}/incomes/update?id=${editingId}` : `${API_URL}/incomes`;
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
        setToast({ show: true, message: editingId ? "Renda atualizada!" : "Renda registrada!", type: "success" });
        closeModal();
        refreshSummary();
        fetchIncomes();
      } else {
        setToast({ show: true, message: "Erro ao salvar", type: "error" });
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function deleteIncome(id) {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/incomes/delete?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: "Renda removida!", type: "success" });
        refreshSummary();
        fetchIncomes();
      }
    } catch (error) {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
    setDeleteModal({ isOpen: false, id: null, desc: "" });
  }

  function openModal(income = null) {
    if (income) {
      setEditingId(income.id);
      const dateStr = income.date ? income.date.split('T')[0] : "";
      setForm({
        description: income.description, amount: income.amount.toString(), date: dateStr, account_id: income.account_id ? income.account_id.toString() : "",
      });
    } else {
      setEditingId(null);
      setForm({ description: "", amount: "", date: new Date().toISOString().split("T")[0], account_id: "" });
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
  }

  const totalIncomes = incomes.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-fade-in relative z-10">
      
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-white">Rendas</h2>
          <div className="flex gap-8 mt-4">
            <div className="flex flex-col">
              <span className="text-secondary text-xs uppercase tracking-widest font-semibold mb-1 opacity-60">Total Entradas</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">trending_up</span>
                <span className="text-primary font-headline text-2xl font-bold">{formatCurrencyBR(totalIncomes)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-high/40 backdrop-blur px-5 py-2.5 rounded-full flex items-center gap-2 text-on-surface hover:bg-surface-container-high transition-colors border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-lg">description</span>
            <span className="font-label font-semibold text-sm">Exportar CSV</span>
          </button>
          <button onClick={() => alert("Assine o plano PRO para desbloquear relatórios em PDF!")} className="bg-surface-container-high/20 backdrop-blur px-5 py-2.5 rounded-full flex items-center gap-2 text-secondary/60 hover:text-primary transition-colors border border-outline-variant/10 cursor-pointer">
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
          <h3 className="font-headline font-bold text-lg text-white">Histórico de Rendas</h3>
          <button onClick={() => openModal()} className="hidden md:flex bg-primary text-on-primary font-bold py-2 px-4 rounded-full items-center gap-1 shadow-[0_0_15px_rgba(90,240,179,0.2)] hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-sm">add</span> Adicionar Renda
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {incomes.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-secondary/50 text-[10px] font-bold uppercase tracking-widest border-b border-outline-variant/5">
                  <th className="px-6 md:px-8 py-4 whitespace-nowrap">Tipo</th>
                  <th className="px-6 md:px-8 py-4">Descrição</th>
                  <th className="px-6 md:px-8 py-4 whitespace-nowrap">Data</th>
                  <th className="px-6 md:px-8 py-4 text-right whitespace-nowrap">Valor</th>
                  <th className="px-6 md:px-8 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {incomes.map((inc) => {
                  const accountName = accounts.find(a => a.id === inc.account_id)?.name || "Sem conta";
                  const dateObj = new Date(inc.date);
                  dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                  const dateStr = dateObj.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                  
                  return (
                    <tr key={inc.id} className="group hover:bg-surface-container-high/40 transition-colors">
                      <td className="px-6 md:px-8 py-5">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <span className="material-symbols-outlined text-xl">payments</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white whitespace-nowrap">Renda</span>
                            <span className="text-[10px] text-secondary md:hidden">{accountName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 md:px-8 py-5">
                        <p className="text-sm text-on-surface font-medium">{inc.description}</p>
                        <p className="text-[11px] text-secondary mt-0.5 hidden md:block">{accountName}</p>
                      </td>
                      <td className="px-6 md:px-8 py-5 text-xs text-secondary font-medium whitespace-nowrap">{dateStr}</td>
                      <td className="px-6 md:px-8 py-5 text-right font-headline font-bold text-primary whitespace-nowrap">+ {formatCurrencyBR(inc.amount)}</td>
                      <td className="px-6 md:px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openModal(inc)} className="p-2 text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined text-xl">edit</span></button>
                          <button onClick={() => setDeleteModal({ isOpen: true, id: inc.id, desc: inc.description })} className="p-2 text-secondary hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
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
              <p>Nenhuma renda encontrada neste período.</p>
            </div>
          )}
        </div>
      </section>

      {/* FAB Mobile Only */}
      <button onClick={() => openModal()} className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_8px_32px_rgba(90,240,179,0.4)] flex items-center justify-center active:scale-90 transition-transform z-50">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>

      {/* Modal Glassmorphism */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-[2rem] w-full max-w-lg p-6 md:p-8 animate-fade-in max-h-[90vh] overflow-y-auto no-scrollbar">
            <h3 className="font-headline text-2xl font-bold text-white mb-6">
              {editingId ? "Editar Renda" : "Nova Renda"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Descrição</label>
                <input required type="text" placeholder="Ex: Salário" className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Valor (R$)</label>
                <CurrencyInput className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-primary font-headline font-bold text-xl rounded-xl p-3.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" value={form.amount} onChange={(val) => setForm({ ...form, amount: val })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Data</label>
                  <input required type="date" className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all [color-scheme:dark]" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] text-secondary font-bold uppercase tracking-wider mb-1 ml-1">Conta (Obrigatório)</label>
                  <select required className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl p-3.5 focus:border-primary outline-none transition-all appearance-none" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                    <option value="" className="bg-surface">Selecione...</option>
                    {accounts.map((acc) => (<option key={acc.id} value={acc.id} className="bg-surface">{acc.name}</option>))}
                  </select>
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

      <ConfirmModal isOpen={deleteModal.isOpen} title="Excluir Renda" message={`Deseja excluir "${deleteModal.desc}"?`} onConfirm={() => deleteIncome(deleteModal.id)} onCancel={() => setDeleteModal({ isOpen: false, id: null, desc: "" })} confirmText="Excluir" isDangerous={true} />
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}