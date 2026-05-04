import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSummary } from "./SummaryContext";
import { formatCurrencyBR } from "./utils/format";
import { Icon } from "./components/Icon";
import API_URL from "./config/api";
import type { Summary, Account, Expense, Income } from "./types";

type Activity = (Expense & { type: "expense" }) | (Income & { type: "income" });

const GROUP_COLORS = {
  essencial:   { color: "#D8997A", label: "Essenciais" },
  lazer:       { color: "#E8B86A", label: "Estilo de Vida" },
  investimento:{ color: "#8FB7E6", label: "Investimento" },
};

// Simple donut chart
function Donut({ r1, l, i }: { r1: number; l: number; i: number }) {
  const values = [r1, l, i];
  const colors = ["#D8997A", "#E8B86A", "#8FB7E6"];
  const total = values.reduce((s, v) => s + v, 0) || 1;
  const size = 180, thickness = 22, cx = size / 2, cy = size / 2;
  const rad = (size - thickness) / 2;
  const C = 2 * Math.PI * rad;
  let acc = 0;
  const segs = values.map((v, i2) => {
    const frac = v / total;
    const seg = { color: colors[i2], dash: frac * C, gap: C - frac * C, offset: -acc * C };
    acc += frac;
    return seg;
  });
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={rad} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={thickness}/>
        {segs.map((s, j) => (
          <circle key={j} cx={cx} cy={cy} r={rad} fill="none"
            stroke={s.color} strokeWidth={thickness}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset} strokeLinecap="butt"/>
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: "var(--b-muted)", fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase" }}>Gasto</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--b-text)", fontVariantNumeric: "tabular-nums" }}>
          {formatCurrencyBR(r1 + l + i)}
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ userName: _userName }: { userName: string }) {
  const navigate = useNavigate();
  const { refreshKey } = useSummary();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pendingFixed, setPendingFixed] = useState<Expense[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const monthName = new Date().toLocaleString("pt-BR", { month: "long" });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  async function fetchAll() {
    setLoading(true); setError(false);
    try {
      const token = localStorage.getItem("token");
      const h = { Authorization: `Bearer ${token}` };
      const [rSum, rAcc, rExp, rInc, rPend] = await Promise.all([
        fetch(`${API_URL}/summary`, { headers: h }),
        fetch(`${API_URL}/accounts`, { headers: h }),
        fetch(`${API_URL}/expenses`, { headers: h }),
        fetch(`${API_URL}/incomes`, { headers: h }),
        fetch(`${API_URL}/expenses/recurring-pending`, { headers: h }),
      ]);
      const [s, accs, exps, incs, pend] = await Promise.all([rSum.json(), rAcc.json(), rExp.json(), rInc.json(), rPend.json()]);
      setSummary(s);
      setAccounts(Array.isArray(accs) ? accs : []);
      const expArr: Expense[] = Array.isArray(exps) ? exps : [];
      setExpenses(expArr);
      setPendingFixed(Array.isArray(pend) ? pend : []);
      const combined: Activity[] = [
        ...expArr.map(e => ({ ...e, type: "expense" as const })),
        ...(Array.isArray(incs) ? incs.map((i: Income) => ({ ...i, type: "income" as const })) : []),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
      setRecentActivities(combined);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchAll(); }, [refreshKey]);

  async function confirmFixed(pending: Expense) {
    setConfirmingId(pending.id);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/expenses/confirm-recurring`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ source_id: pending.id, account_id: pending.account_id }),
      });
      fetchAll();
    } finally { setConfirmingId(null); }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ width: 40, height: 40, borderRadius: 999, border: "3px solid rgba(127,224,160,0.2)", borderTopColor: "var(--b-primary)", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !summary) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 12, textAlign: "center" }}>
      <Icon name="wifi_off" size={48} color="rgba(241,244,240,0.2)" />
      <p style={{ color: "var(--b-muted)" }}>Não foi possível carregar os dados.</p>
      <button onClick={fetchAll} style={{ color: "var(--b-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Tentar novamente</button>
    </div>
  );

  const netWorth = accounts.reduce((s, a) => s + a.balance, 0);
  const isEmpty = expenses.length === 0 && summary.renda_total === 0;

  return (
    <div style={{ paddingBottom: 32 }} className="animate-fade-in">

      {/* Empty state */}
      {isEmpty && (
        <div style={{
          background: "var(--b-surface)", border: "1px solid var(--b-border)",
          borderRadius: 28, padding: "24px 20px", marginBottom: 20,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: 999, background: "var(--b-primary-soft)", filter: "blur(40px)" }} />
          <p style={{ fontSize: 12, color: "var(--b-primary)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>Bem-vindo ao Broto</p>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, letterSpacing: -0.4 }}>Por onde começar?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "account_balance_wallet", label: "Adicione uma conta", to: "/accounts", color: "var(--b-primary)" },
              { icon: "settings", label: "Configure seu salário", to: "/settings", color: "var(--b-blue)" },
              { icon: "trending_down", label: "Registre um gasto", to: "/expenses", color: "var(--b-amber)" },
            ].map(({ icon, label, to, color }, i) => (
              <button key={to} onClick={() => navigate(to)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: "rgba(255,255,255,0.03)", border: "1px solid var(--b-border)",
                borderRadius: 16, cursor: "pointer", textAlign: "left",
              }}>
                <span style={{ fontSize: 12, color: "var(--b-dim)", fontWeight: 600 }}>0{i + 1}</span>
                <Icon name={icon} size={18} color={color} />
                <span style={{ fontSize: 14, color: "var(--b-text)", fontWeight: 500 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero — patrimônio */}
      <div style={{
        background: `radial-gradient(120% 100% at 0% 0%, rgba(127,224,160,0.18), transparent 55%), var(--b-surface)`,
        border: "1px solid var(--b-border)", borderRadius: 28, padding: "20px 22px", marginBottom: 16,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "var(--b-muted)", fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>Patrimônio total</span>
          <Icon name="account_balance_wallet" size={20} color="rgba(127,224,160,0.5)" />
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: -1, marginBottom: 14 }}>
          {formatCurrencyBR(netWorth)}
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          background: "rgba(127,224,160,0.08)", borderRadius: 14,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--b-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name={summary.saldo_restante >= 0 ? "arrow_upward" : "arrow_downward"} size={14} color="var(--b-primary)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--b-muted)", fontWeight: 500 }}>Disponível este mês</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: summary.saldo_restante >= 0 ? "var(--b-primary)" : "var(--b-rose)", fontVariantNumeric: "tabular-nums" }}>
              {formatCurrencyBR(summary.saldo_restante)}
            </div>
          </div>
          {(summary.salario > 0 || summary.renda_extra > 0) && (
            <div style={{ fontSize: 11, color: "var(--b-dim)", textAlign: "right", lineHeight: 1.4, fontVariantNumeric: "tabular-nums" }}>
              {summary.salario > 0 && <div>Salário {formatCurrencyBR(summary.salario)}</div>}
              {summary.renda_extra > 0 && <div>Extras {formatCurrencyBR(summary.renda_extra)}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 50/30/20 Donut */}
      <div style={{ background: "var(--b-surface)", border: "1px solid var(--b-border)", borderRadius: 28, padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Sua regra 50/30/20</span>
          <span style={{ fontSize: 12, color: "var(--b-dim)" }}>{capitalizedMonth}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Donut r1={summary.real_fixos} l={summary.real_lazer} i={summary.real_invest} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          {[
            { label: "Essenciais", value: summary.real_fixos, color: "#D8997A" },
            { label: "Estilo de Vida", value: summary.real_lazer, color: "#E8B86A" },
            { label: "Investimento", value: summary.real_invest, color: "#8FB7E6" },
          ].map(g => (
            <div key={g.label} style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: g.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "var(--b-muted)", fontWeight: 500 }}>{g.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrencyBR(g.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Group cards */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { key: "essencial", spent: summary.real_fixos, ideal: summary.ideal_fixos, label: "Essenciais" },
          { key: "lazer",     spent: summary.real_lazer,  ideal: summary.ideal_lazer,  label: "Estilo" },
          { key: "investimento", spent: summary.real_invest, ideal: summary.ideal_invest, label: "Investir" },
        ].map(({ key, spent, ideal, label }) => {
          const meta = GROUP_COLORS[key as keyof typeof GROUP_COLORS];
          const over = spent > ideal && ideal > 0;
          const pct = ideal > 0 ? Math.min(100, Math.round((spent / ideal) * 100)) : 0;
          return (
            <div key={key} style={{
              flex: 1, background: "var(--b-surface)", border: "1px solid var(--b-border)",
              borderRadius: 20, padding: 14, display: "flex", flexDirection: "column", gap: 8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: meta.color }} />
                <span style={{ fontSize: 11, color: "var(--b-muted)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: over ? "var(--b-rose)" : "var(--b-text)" }}>
                  {formatCurrencyBR(spent)}
                </div>
                <div style={{ fontSize: 10, color: "var(--b-dim)", fontVariantNumeric: "tabular-nums" }}>de {formatCurrencyBR(ideal)}</div>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: over ? "var(--b-rose)" : meta.color, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: over ? "var(--b-rose)" : "var(--b-muted)" }}>{pct}%{over ? " · acima" : ""}</span>
            </div>
          );
        })}
      </div>

      {/* Pending fixed */}
      {pendingFixed.length > 0 && (
        <div style={{
          background: "var(--b-amber-soft)", border: "1px solid rgba(232,184,106,0.22)",
          borderRadius: 28, padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Icon name="schedule" size={16} color="var(--b-amber)" />
            <span style={{ fontSize: 13, color: "var(--b-amber)", fontWeight: 600 }}>Fixos pendentes este mês</span>
            <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, background: "rgba(232,184,106,0.2)", color: "var(--b-amber)", borderRadius: 999, padding: "2px 8px" }}>{pendingFixed.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {pendingFixed.map((p, i) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "8px 4px",
                borderTop: i > 0 ? "1px solid rgba(232,184,106,0.10)" : "none",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: "rgba(232,184,106,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="receipt" size={15} color="var(--b-amber)" />
                </div>
                <span style={{ flex: 1, fontSize: 14, color: "var(--b-text)", fontWeight: 500 }}>{p.description}</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatCurrencyBR(p.amount)}</span>
                <button
                  onClick={() => confirmFixed(p)}
                  disabled={confirmingId === p.id}
                  style={{
                    background: "var(--b-amber)", color: "#231505",
                    border: "none", borderRadius: 999, padding: "6px 12px",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: confirmingId === p.id ? 0.5 : 1,
                  }}
                >{confirmingId === p.id ? "..." : "Confirmar"}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Atividade recente</span>
          <button onClick={() => navigate("/expenses")} style={{ fontSize: 13, color: "var(--b-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Ver tudo</button>
        </div>
        {recentActivities.length > 0 ? (
          <div style={{ background: "var(--b-surface)", border: "1px solid var(--b-border)", borderRadius: 28, padding: "4px 18px" }}>
            {recentActivities.map((act, idx) => {
              const isIncome = act.type === "income";
              const d = new Date(act.date);
              d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
              const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
              return (
                <div key={`${act.type}-${act.id}`}
                  onClick={() => !isIncome && navigate("/expenses", { state: { highlightId: act.id, month: String(d.getMonth()+1), year: String(d.getFullYear()) }})}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                    borderTop: idx > 0 ? "1px solid var(--b-border)" : "none",
                    cursor: isIncome ? "default" : "pointer",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 999, flexShrink: 0,
                    background: isIncome ? "var(--b-primary-soft)" : "rgba(127,224,160,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={isIncome ? "arrow_upward" : "receipt"} size={18} color={isIncome ? "var(--b-primary)" : "var(--b-muted)"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{act.description}</div>
                    <div style={{ fontSize: 12, color: "var(--b-dim)" }}>{'category' in act ? act.category : "Renda"} · {dateStr}</div>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums",
                    color: isIncome ? "var(--b-primary)" : "var(--b-text)",
                  }}>{isIncome ? "+" : "−"} {formatCurrencyBR(act.amount)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: "var(--b-surface)", border: "1px solid var(--b-border)", borderRadius: 28, padding: 40, textAlign: "center" }}>
            <Icon name="receipt_long" size={40} color="rgba(241,244,240,0.15)" />
            <p style={{ color: "var(--b-muted)", marginTop: 12 }}>Nenhuma movimentação recente</p>
          </div>
        )}
      </div>
    </div>
  );
}
