import { useState } from "react";
import { CurrencyInput } from "./CurrencyInput";
import { CATEGORIES } from "./CategorySelect";
import API_URL from "../config/api";
import { formatCurrencyBR } from "../utils/format";
import type { Account, Expense } from "../types";

// Grupo padrão inferido por categoria
const CATEGORY_GROUP: Record<string, Expense["group"]> = {
  moradia: "essencial", alimentacao: "essencial", transporte: "essencial",
  contas: "essencial", saude: "essencial", educacao: "essencial", dividas: "essencial",
  lazer: "lazer", restaurantes: "lazer", streaming: "lazer", compras: "lazer",
  viagens: "lazer", pets: "lazer", presentes: "lazer", doacoes: "lazer",
  investimentos: "investimento", poupanca: "investimento", previdencia: "investimento",
  outros: "essencial",
};

const LAST_ACCOUNT_KEY = "quickadd_last_account";

interface QuickAddExpenseProps {
  accounts: Account[];
  onSuccess: () => void;
  onOpenFullForm: () => void;
  onClose: () => void;
}

export function QuickAddExpense({ accounts, onSuccess, onOpenFullForm, onClose }: QuickAddExpenseProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [accountId, setAccountId] = useState(() => localStorage.getItem(LAST_ACCOUNT_KEY) || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inferredGroup = CATEGORY_GROUP[category] ?? "essencial";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !category || !accountId) {
      setError("Preencha valor, categoria e conta.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          description: CATEGORIES.find(c => c.value === category)?.label ?? category,
          amount: parseFloat(amount),
          category,
          group: inferredGroup,
          payment_method: "",
          date: new Date().toISOString().split("T")[0],
          account_id: parseInt(accountId),
          installments: 1,
        }),
      });
      if (res.ok) {
        localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
        onSuccess();
        onClose();
      } else {
        setError("Erro ao salvar. Tente novamente.");
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  const groupLabel = { essencial: "Essencial", lazer: "Estilo de Vida", investimento: "Investimento" }[inferredGroup];
  const groupColor = { essencial: "text-primary", lazer: "text-amber-400", investimento: "text-sky-400" }[inferredGroup];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#131b2e] border border-outline-variant/20 shadow-2xl rounded-t-[2rem] sm:rounded-[2rem] w-full sm:max-w-md animate-fade-in">
        {/* Handle mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-outline-variant/40 rounded-full" />
        </div>

        <div className="px-6 pt-4 pb-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-lg font-bold text-white">Lançamento Rápido</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Valor */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">Valor</label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white font-headline font-bold text-2xl rounded-xl px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-center"
                autoFocus
              />
            </div>

            {/* Categoria — grid compacto */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">Categoria</label>
              <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all ${
                      category === cat.value
                        ? "border-primary/60 bg-primary/10 text-white"
                        : "border-white/5 bg-white/5 text-secondary hover:border-primary/30 hover:text-white"
                    }`}
                  >
                    <cat.icon className="text-sm text-primary" />
                    <span className="text-[9px] text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
              {category && (
                <p className="text-[10px] mt-1.5 text-secondary/60">
                  Classificado como: <span className={`font-bold ${groupColor}`}>{groupLabel}</span>
                </p>
              )}
            </div>

            {/* Conta */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-1.5">Conta</label>
              <div className="relative">
                <select
                  required
                  className="w-full bg-surface-container-highest/40 border border-outline-variant/10 text-white rounded-xl px-4 py-3 focus:border-primary outline-none transition-all appearance-none"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  <option value="" className="bg-surface">Selecione...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id} className="bg-surface">{acc.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">expand_more</span>
              </div>
            </div>

            {error && <p className="text-xs text-error font-medium">{error}</p>}

            {/* Ações */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onOpenFullForm}
                className="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold text-secondary hover:text-white hover:bg-surface-container-high transition-colors border border-outline-variant/10"
              >
                Mais detalhes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary/90 shadow-[0_4px_15px_rgba(90,240,179,0.3)] transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? "Salvando..." : `Salvar ${amount ? formatCurrencyBR(parseFloat(amount)) : ""}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
