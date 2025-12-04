import { useState } from "react";
import { HiDownload } from "react-icons/hi";

export function ExportData() {
  const [downloading, setDownloading] = useState(false);

  async function handleExportCompleto() {
    try {
      setDownloading(true);
      const token = localStorage.getItem("token");

      // Buscar todos os dados
      const [expensesRes, incomesRes, accountsRes, goalsRes, summaryRes] = await Promise.all([
        fetch("http://localhost:8080/expenses", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/incomes", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/accounts", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/goals", { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:8080/summary?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const expenses = (await expensesRes.json()) || [];
      const incomes = (await incomesRes.json()) || [];
      const accounts = (await accountsRes.json()) || [];
      const goals = (await goalsRes.json()) || [];
      const summary = (await summaryRes.json()) || {};

      // Criar array de arrays para CSV (melhor compatibilidade com Excel)
      const csvData = [];

      // Cabeçalho
      csvData.push(["RELATÓRIO FINANCEIRO COMPLETO"]);
      csvData.push(["Data de geração", new Date().toLocaleDateString("pt-BR")]);
      csvData.push([]);

      // Resumo do mês
      csvData.push(["RESUMO DO MÊS"]);
      csvData.push(["Renda Total", formatarBRL(summary.renda_total || 0)]);
      csvData.push(["Gasto Total", formatarBRL(summary.gasto_total || 0)]);
      csvData.push(["Saldo Restante", formatarBRL(summary.saldo_restante || 0)]);
      csvData.push([]);

      // Contas
      csvData.push(["CONTAS BANCÁRIAS"]);
      csvData.push(["Nome", "Tipo", "Saldo"]);
      accounts.forEach((acc) => {
        csvData.push([acc.name, acc.type, formatarBRL(acc.balance)]);
      });
      const totalContas = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      csvData.push(["TOTAL", "", formatarBRL(totalContas)]);
      csvData.push([]);

      // Gastos
      csvData.push(["GASTOS"]);
      csvData.push(["Data", "Categoria", "Valor", "Conta"]);
      expenses.forEach((exp) => {
        const date = new Date(exp.date).toLocaleDateString("pt-BR");
        csvData.push([date, exp.category, formatarBRL(exp.amount), exp.account_name || "-"]);
      });
      const totalGastos = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      csvData.push(["TOTAL", "", formatarBRL(totalGastos), ""]);
      csvData.push([]);

      // Rendas
      csvData.push(["RENDAS"]);
      csvData.push(["Data", "Categoria", "Valor", "Conta"]);
      incomes.forEach((inc) => {
        const date = new Date(inc.date).toLocaleDateString("pt-BR");
        csvData.push([date, inc.category, formatarBRL(inc.amount), inc.account_name || "-"]);
      });
      const totalRendas = incomes.reduce((sum, inc) => sum + inc.amount, 0);
      csvData.push(["TOTAL", "", formatarBRL(totalRendas), ""]);
      csvData.push([]);

      // Metas
      csvData.push(["METAS FINANCEIRAS"]);
      csvData.push(["Nome", "Meta", "Progresso", "Faltam", "Status", "Prazo"]);
      goals.forEach((goal) => {
        const percent = ((goal.current_amount / goal.target_amount) * 100).toFixed(1);
        const falta = Math.max(0, goal.target_amount - goal.current_amount);
        const status = goal.current_amount >= goal.target_amount ? "✓ Concluída" : "⏳ Em andamento";
        const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString("pt-BR") : "-";
        csvData.push([
          goal.name,
          formatarBRL(goal.target_amount),
          `${formatarBRL(goal.current_amount)} (${percent}%)`,
          formatarBRL(falta),
          status,
          deadline,
        ]);
      });

      // Converter para CSV
      const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

      // Baixar arquivo
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_financeiro_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Erro ao exportar:", e);
      alert("Erro ao exportar relatório.");
    } finally {
      setDownloading(false);
    }
  }

  function formatarBRL(valor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  return (
    <button
      onClick={handleExportCompleto}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition duration-200 disabled:opacity-60"
      disabled={downloading}
    >
      <HiDownload className="text-lg" />
      {downloading ? "Exportando..." : "Exportar Relatório Completo"}
    </button>
  );
}
