import { useEffect, useState } from "react";
import { useSummary } from "./SummaryContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { HiChartBar, HiHome, HiSparkles, HiTrendingUp, HiCheckCircle, HiExclamation, HiChevronDown, HiInformationCircle } from "react-icons/hi";
import { formatCurrencyBR } from "./utils/format";
import API_URL from "./config/api";
import { ExportData } from "./components/ExportData";
import { PageHeader } from "./components/PageHeader";

export default function Dashboard({ userName, getGreeting }) {
  const [summary, setSummary] = useState(null);
  const [monthlyHistory, setMonthlyHistory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [unlinkedData, setUnlinkedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [preferences, setPreferences] = useState({
    expenses_percent: 50,
    entertainment_percent: 30,
    investment_percent: 20,
  });
  const { refreshKey } = useSummary();

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPreferences(data);
      } catch (error) {
        console.error("Erro ao buscar preferências:", error);
      }
    }

    async function fetchSummary() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (month) params.set("month", String(month));
        if (year) params.set("year", String(year));
        const apiUrl = API_URL || "http://localhost:8080";
        const url = `${apiUrl}/summary${params.toString() ? `?${params.toString()}` : ""}`;
        const token = localStorage.getItem("token");
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSummary(data);
      } catch (error) {
        console.error("Erro ao buscar resumo:", error);
      } finally {
        setLoading(false);
      }
    }

    async function fetchMonthlyHistory() {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/summary/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMonthlyHistory(data || []);
      } catch (error) {
        console.error("Erro ao buscar histórico mensal:", error);
      }
    }

    async function fetchAccounts() {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAccounts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar contas:", error);
        setAccounts([]);
      }
    }

    async function checkUnlinkedTransactions() {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = API_URL || "http://localhost:8080";
        const res = await fetch(`${apiUrl}/migration/check`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.has_unlinked) {
          setUnlinkedData(data);
        }
      } catch (error) {
        console.error("Erro ao verificar transações não vinculadas:", error);
      }
    }

    fetchPreferences();
    fetchSummary();
    fetchMonthlyHistory();
    fetchAccounts();
    checkUnlinkedTransactions();
  }, [refreshKey, month, year]);

  async function handleMigrateTransactions() {
    try {
      setMigrating(true);
      const token = localStorage.getItem("token");
      const apiUrl = API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/migration/migrate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setUnlinkedData(null);
        // Recarrega dados
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao migrar transações:", error);
      alert("Erro ao organizar transações. Tente novamente.");
    } finally {
      setMigrating(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-gray-300">Carregando seu resumo financeiro...</p>
        </div>
      </div>
    );
  if (!summary)
    return (
      <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-6 rounded-lg text-center">
        ❌ Erro ao carregar dados
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader 
        title="Resumo Financeiro" 
        subtitle={`${summary.mes}/${summary.ano}`}
        description="Visualize um resumo completo de suas finanças, incluindo receitas, despesas, saldo e distribuição de renda de acordo com suas preferências pessoais. Customize as porcentagens nas Configurações."
        colorClass="from-blue-600 to-cyan-600"
        greeting={
          userName && getGreeting ? (
            <p className="text-xs md:text-sm lg:text-base text-blue-100 m-0">
              <span className="text-lg font-semibold text-blue-100">
                {getGreeting()}, <span className="font-bold bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">{userName}</span>!
              </span>
            </p>
          ) : null
        }
      />

      {/* Banner de Migração */}
      {unlinkedData && (
        <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/40 border-2 border-orange-500/60 rounded-xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <HiExclamation className="text-orange-400 text-3xl flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-orange-300 font-bold text-lg mb-2">
                Transações Não Vinculadas Detectadas
              </h3>
              <p className="text-orange-200 text-sm mb-3">
                Você tem <strong>{unlinkedData.total_unlinked} transação(ões)</strong> ({unlinkedData.unlinked_incomes} rendas, {unlinkedData.unlinked_expenses} gastos) 
                que não estão vinculadas a nenhuma conta. Isso pode causar inconsistência no seu patrimônio.
              </p>
              <p className="text-orange-100 text-xs mb-4">
                💡 Vamos organizar? Clique abaixo para criar automaticamente uma "Carteira Geral" e vincular todas essas transações.
              </p>
              <button
                onClick={handleMigrateTransactions}
                disabled={migrating}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-lg transition shadow-md flex items-center gap-2"
              >
                {migrating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Organizando...
                  </>
                ) : (
                  <>
                    <HiCheckCircle className="text-xl" />
                    Organizar Transações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Mês</label>
            <div className="relative">
              <select
                className="bg-slate-700 border border-slate-600 text-white rounded-lg p-2 pr-10 w-40 focus:border-cyan-400 focus:outline-none appearance-none cursor-pointer"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">Atual</option>
                <option value="1">Janeiro</option>
                <option value="2">Fevereiro</option>
                <option value="3">Março</option>
                <option value="4">Abril</option>
                <option value="5">Maio</option>
                <option value="6">Junho</option>
                <option value="7">Julho</option>
                <option value="8">Agosto</option>
                <option value="9">Setembro</option>
                <option value="10">Outubro</option>
                <option value="11">Novembro</option>
                <option value="12">Dezembro</option>
              </select>
              <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ano</label>
            <div className="relative">
              <select
                className="bg-slate-700 border border-slate-600 text-white rounded-lg p-2 pr-10 w-32 focus:border-cyan-400 focus:outline-none appearance-none cursor-pointer"
                size="1"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="">Atual</option>
                {Array.from({ length: 31 }, (_, i) => 2020 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <HiChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <button
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition duration-200"
            onClick={() => { setMonth(""); setYear(""); }}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Cards de Renda e Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Renda Total</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrencyBR(summary.renda_total)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Gastos Totais</p>
              <p className="text-3xl font-bold mt-2">
                {formatCurrencyBR(summary.gasto_total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Patrimônio */}
      {accounts.length > 0 ? (
        <div className="bg-gradient-to-br from-cyan-900 to-blue-900 border border-cyan-700 rounded-xl p-6 shadow-lg">
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Patrimônio Total
            </h2>
          </div>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-cyan-200 text-sm font-medium">Soma de todas as contas</p>
              <p className="text-4xl font-bold text-white mt-2">
                {formatCurrencyBR(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {accounts.map((acc) => (
              <div key={acc.id} className="bg-slate-800/50 border border-cyan-800/30 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-cyan-300 text-xs font-medium uppercase">{acc.type}</p>
                    <p className="text-white font-semibold mt-1">{acc.name}</p>
                  </div>
                  {acc.name === "Carteira Geral" && (
                    <InfoIcon tooltip="A Carteira Geral agrupa transações sem uma conta específica. Novos gastos/rendas sem conta selecionada vão para lá automaticamente." />
                  )}
                </div>
                <p className="text-cyan-100 text-lg font-bold mt-2">{formatCurrencyBR(acc.balance)}</p>
              </div>
            ))}
          </div>
          <p className="text-cyan-300 text-xs mt-4 flex items-center gap-1">
            <HiCheckCircle className="text-cyan-400" />
            Este é o dinheiro real disponível em suas contas. Rendas e gastos atualizam automaticamente estes saldos.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-900/20 border-2 border-yellow-600/50 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <HiExclamation className="text-yellow-500 text-2xl flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-yellow-300 font-bold text-lg mb-2">💡 Dica: Cadastre suas contas!</h3>
              <p className="text-yellow-200 text-sm mb-3">
                Para um controle financeiro completo, cadastre suas contas (banco, carteira, poupança, etc). 
                Assim você saberá exatamente onde está cada centavo e poderá acompanhar seu patrimônio total.
              </p>
              <a 
                href="/accounts" 
                className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition"
              >
                Criar Primeira Conta
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Distribuição 50/30/20 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <HiChartBar className="text-cyan-400" />
          Distribuição {preferences.expenses_percent.toFixed(0)} / {preferences.entertainment_percent.toFixed(0)} / {preferences.investment_percent.toFixed(0)}
        </h2>
        <div className="space-y-4">
          <Category
            icon={<HiHome className="text-blue-400" />}
            name={`Despesas Fixas (${preferences.expenses_percent.toFixed(0)}%)`}
            ideal={summary.ideal_fixos}
            real={summary.real_fixos}
          />
          <Category
            icon={<HiSparkles className="text-purple-400" />}
            name={`Lazer & Diversão (${preferences.entertainment_percent.toFixed(0)}%)`}
            ideal={summary.ideal_lazer}
            real={summary.real_lazer}
          />
          <Category
            icon={<HiTrendingUp className="text-emerald-400" />}
            name={`Investimentos (${preferences.investment_percent.toFixed(0)}%)`}
            ideal={summary.ideal_invest}
            real={summary.real_invest}
          />
        </div>
      </div>

      {/* Saldo Restante */}
      <div className={`rounded-lg p-6 text-white shadow-lg ${
        summary.saldo_restante >= 0
          ? "bg-gradient-to-br from-cyan-600 to-blue-600"
          : "bg-gradient-to-br from-orange-600 to-red-600"
      }`}>
        <p className="text-blue-100 text-sm font-medium mb-2">Saldo Restante</p>
        <p className="text-4xl font-bold">
          {formatCurrencyBR(summary.saldo_restante)}
        </p>
        <p className="text-blue-100 text-sm mt-2 flex items-center gap-2">
          {summary.saldo_restante >= 0
            ? <><HiCheckCircle className="text-emerald-300" /> Você está no controle!</>
            : <><HiExclamation className="text-orange-300" /> Gasto acima do planejado</>}
        </p>
      </div>

      {/* Evolução Mensal */}
      {monthlyHistory.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <HiTrendingUp className="text-cyan-400" />
            Evolução dos Últimos 12 Meses
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyHistory} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="rgb(209, 213, 219)" />
              <YAxis stroke="rgb(209, 213, 219)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(15, 23, 42, 0.95)", 
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                  color: "white"
                }}
                formatter={(value) => `R$ ${value.toFixed(2)}`}
              />
              <Legend 
                iconType="circle"
                iconSize={6}
                align="center"
                verticalAlign="bottom"
                formatter={(value) => <span style={{ verticalAlign: "middle" }}>{value}</span>}
                wrapperStyle={{ marginTop: "65px" }}
              />
              <Bar dataKey="income" fill="#10b981" name="Renda" />
              <Bar dataKey="expenses" fill="#ef4444" name="Gastos" />
              <Bar dataKey="balance" fill="#06b6d4" name="Saldo" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Botões de Exportação */}
      <div className="flex justify-center">
        <ExportData />
      </div>
    </div>
  );
}

// Componente para exibir cada categoria do 50/30/20
function Category({ icon, name, ideal, real }) {
  const perc = ideal > 0 ? ((real / ideal) * 100).toFixed(1) : 0;
  const isOverBudget = perc > 100;
  const isWarning = perc >= 80 && perc <= 100;
  const isGood = perc < 80;

  return (
    <div className="bg-slate-700/50 border border-slate-600 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <p className="text-white font-semibold flex items-center gap-2">{icon} {name}</p>
        <p className={`text-lg font-bold ${
          isGood ? "text-emerald-400" : isWarning ? "text-yellow-400" : "text-red-400"
        }`}>
          {perc}%
        </p>
      </div>
      <div className="w-full bg-slate-600 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isGood ? "bg-emerald-500" : isWarning ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${Math.min(perc, 100)}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>R$ {real?.toFixed(2) || "0.00"}</span>
        <span>Limite: {formatCurrencyBR(ideal)}</span>
      </div>
    </div>
  );
}

function InfoIcon({ tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="text-cyan-300 hover:text-cyan-100 transition-colors focus:outline-none"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        <HiInformationCircle className="text-lg" />
      </button>

      {showTooltip && (
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-48 bg-slate-900 text-cyan-100 text-xs rounded-lg shadow-xl border border-cyan-500/30 p-3 z-50 pointer-events-none">
          {tooltip}
        </div>
      )}
    </div>
  );
}
