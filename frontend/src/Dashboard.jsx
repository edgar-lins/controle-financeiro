import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { formatCurrencyBR } from "./utils/format";
import API_URL from "./config/api";

export default function Dashboard({ userName }) {
  const [summary, setSummary] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { refreshKey } = useSummary();

  const currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const apiUrl = API_URL || "http://localhost:8080";
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Busca Resumo 50/30/20
        const resSummary = await fetch(`${apiUrl}/summary`, { headers });
        const dataSummary = await resSummary.json();
        setSummary(dataSummary);

        // 2. Busca Contas (Para o Patrimônio Total)
        const resAccounts = await fetch(`${apiUrl}/accounts`, { headers });
        const dataAccounts = await resAccounts.json();
        setAccounts(Array.isArray(dataAccounts) ? dataAccounts : []);

        // 3. Busca Atividades Recentes (Mesclando Gastos e Rendas)
        const resExp = await fetch(`${apiUrl}/expenses`, { headers });
        const exps = await resExp.json();
        const expenses = Array.isArray(exps) ? exps.map(e => ({ ...e, type: 'expense' })) : [];

        const resInc = await fetch(`${apiUrl}/incomes`, { headers });
        const incs = await resInc.json();
        const incomes = Array.isArray(incs) ? incs.map(i => ({ ...i, type: 'income' })) : [];

        // Junta, ordena por data (mais recente primeiro) e pega os 5 últimos
        const combined = [...expenses, ...incomes]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 5);
        
        setRecentActivities(combined);

      } catch (error) {
        console.error("Erro ao buscar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [refreshKey]);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Cálculos
  const totalNetWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  // Progresso 50/30/20 (limitado a 100% para a barra visual)
  const calcPerc = (real, ideal) => ideal > 0 ? Math.min((real / ideal) * 100, 100).toFixed(1) : 0;
  const percNeeds = calcPerc(summary.real_fixos, summary.ideal_fixos);
  const percWants = calcPerc(summary.real_lazer, summary.ideal_lazer);
  const percSavings = calcPerc(summary.real_invest, summary.ideal_invest);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Net Worth Hero Card */}
      <section className="relative overflow-hidden rounded-[2rem] p-8 bg-[rgba(45,52,73,0.4)] backdrop-blur-xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] border border-white/5">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <span className="text-secondary font-label text-sm font-medium tracking-wide">Patrimônio Total</span>
            <span className="material-symbols-outlined text-primary/60 text-2xl">account_balance_wallet</span>
          </div>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-white tracking-tighter mb-2">
            {formatCurrencyBR(totalNetWorth)}
          </h1>
          <div className="flex items-center gap-2">
            <span className={`flex items-center text-sm font-semibold ${summary.saldo_restante >= 0 ? "text-primary" : "text-error"}`}>
              <span className="material-symbols-outlined text-sm mr-1">
                {summary.saldo_restante >= 0 ? "trending_up" : "trending_down"}
              </span>
              Saldo Mensal: {formatCurrencyBR(summary.saldo_restante)}
            </span>
          </div>
        </div>
      </section>

      {/* 50/30/20 Budget Tracking */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="font-headline font-bold text-2xl text-white">Orçamento 50/30/20</h2>
          <span className="text-primary text-sm font-medium">{capitalizedMonth}</span>
        </div>
        
        <div className="space-y-6 bg-surface-container-low/50 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl">
          {/* Necessidades (50%) */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface font-semibold tracking-wide">Necessidades</span>
              <span className="text-secondary font-medium">{formatCurrencyBR(summary.real_fixos)} / <span className="text-white/40">{formatCurrencyBR(summary.ideal_fixos)}</span></span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${percNeeds}%` }}>
                <div className="absolute inset-0 bg-white/20"></div>
              </div>
            </div>
          </div>

          {/* Desejos (30%) */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface font-semibold tracking-wide">Desejos</span>
              <span className="text-secondary font-medium">{formatCurrencyBR(summary.real_lazer)} / <span className="text-white/40">{formatCurrencyBR(summary.ideal_lazer)}</span></span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-primary/70 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percWants}%` }}></div>
            </div>
          </div>

          {/* Poupança (20%) */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface font-semibold tracking-wide">Investimento</span>
              <span className="text-secondary font-medium">{formatCurrencyBR(summary.real_invest)} / <span className="text-white/40">{formatCurrencyBR(summary.ideal_invest)}</span></span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-primary/40 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percSavings}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activities Bento Layout */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-headline font-bold text-2xl text-white">Atividades Recentes</h2>
        </div>

        {recentActivities.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {recentActivities.map((act) => {
              const isIncome = act.type === 'income';
              const dateObj = new Date(act.date);
              // Corrige timezone se necessário
              dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
              const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

              return (
                <div key={`${act.type}-${act.id}`} className="group flex items-center justify-between p-4 bg-surface-container-low/60 hover:bg-surface-container-high/80 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${isIncome ? 'bg-primary/10 text-primary' : 'bg-tertiary-container/10 text-tertiary-container'}`}>
                      <span className="material-symbols-outlined">
                        {isIncome ? "payments" : "shopping_cart"}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm md:text-base tracking-wide">{act.description}</p>
                      <p className="text-secondary text-xs mt-0.5">{act.category || "Geral"} • {dateStr}</p>
                    </div>
                  </div>
                  <p className={`font-headline font-bold tracking-tight ${isIncome ? 'text-primary' : 'text-tertiary-container'}`}>
                    {isIncome ? "+" : "-"} {formatCurrencyBR(act.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-low/50 rounded-3xl p-10 text-center border border-white/5">
            <span className="material-symbols-outlined text-secondary/30 text-5xl mb-3">receipt_long</span>
            <p className="text-secondary font-medium">Nenhuma movimentação recente</p>
            <p className="text-secondary/60 text-sm mt-1">Sua lista de atividades aparecerá aqui.</p>
          </div>
        )}
      </section>

    </div>
  );
}