import { useState } from "react";
import API_URL from "./config/api";
import { BrotoLogo } from "./components/BrotoLogo";

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [balance, setBalance] = useState("");
  const [income, setIncome] = useState("");
  const [loading, setLoading] = useState(false);

  const userName = localStorage.getItem("firstName") || "Visitante";

  async function handleCreateAccount() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = API_URL;
      
      const numericBalance = parseFloat(balance.replace(",", ".")) || 0;

      // 1. Cria a Conta "Carteira Geral"
      await fetch(`${apiUrl}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: "Carteira Geral",
          type: "corrente",
          opening_balance: numericBalance,
          balance: numericBalance,
        }),
      });

      setStep(3);
    } catch (error) {
      console.error("Erro ao criar conta:", error);
      alert("Erro ao salvar saldo inicial. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateIncome() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = API_URL;

      const numericIncome = parseFloat(income.replace(",", ".")) || 0;

      if (numericIncome > 0) {
        // 1. Busca a conta criada para pegar o ID
        const resAccounts = await fetch(`${apiUrl}/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const accounts = await resAccounts.json();
        const carteira = accounts.find((acc: { name: string; id: number }) => acc.name === "Carteira Geral");

        // 2. Registra a Renda vinculada à carteira
        if (carteira) {
          await fetch(`${apiUrl}/incomes`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              description: "Renda Principal",
              amount: numericIncome,
              account_id: carteira.id,
              category: "salario",
              date: new Date().toISOString().split("T")[0]
            }),
          });
        }

        // 3. Atualiza as preferências do usuário com a renda mensal esperada
        await fetch(`${apiUrl}/preferences`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            expenses_percent: 50,
            entertainment_percent: 30,
            investment_percent: 20,
            expected_monthly_income: numericIncome,
          }),
        });
      }

      setStep(4);
    } catch (error) {
      console.error("Erro ao criar renda:", error);
      alert("Erro ao salvar renda mensal. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // --- PASSO 1: BOAS-VINDAS ---
  if (step === 1) {
    return (
      <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-tertiary/5 rounded-full blur-[100px]"></div>
        <main className="w-full max-w-lg px-8 py-12 relative z-10 text-center">
          <div className="flex justify-center mb-12">
            <div style={{
              width: 140, height: 140, borderRadius: 999,
              background: "var(--b-primary-soft)", border: "1px solid rgba(127,224,160,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BrotoLogo size={80} />
            </div>
          </div>
          <div className="text-center space-y-5">
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-on-surface">
              Olá, <span className="text-primary">{userName}</span>!<br/>Vamos plantar juntos.
            </h1>
            <p className="text-secondary text-base leading-relaxed max-w-md mx-auto">
              Seu dinheiro é como um broto — cresce com cuidado diário, não com pressa.
            </p>
          </div>
          <div className="mt-12 flex justify-center gap-2">
            <div className="w-8 h-1.5 bg-primary rounded-full"></div>
            <div className="w-2 h-1.5 bg-surface-container-highest rounded-full"></div>
            <div className="w-2 h-1.5 bg-surface-container-highest rounded-full"></div>
            <div className="w-2 h-1.5 bg-surface-container-highest rounded-full"></div>
          </div>
          <div className="mt-10">
            <button onClick={() => setStep(2)} className="w-full py-5 px-8 rounded-full bg-primary text-on-primary font-headline font-bold text-lg shadow-[0_12px_40px_rgba(90,240,179,0.25)] flex items-center justify-center gap-3 transition-all hover:scale-[1.02]">
              Começar <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="text-center mt-6 text-sm font-medium text-outline-variant tracking-wide">PASSO 1 DE 4</p>
          </div>
        </main>
      </div>
    );
  }

  // --- PASSO 2: SALDO INICIAL ---
  if (step === 2) {
    return (
      <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <main className="relative z-10 w-full max-w-xl px-6 py-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-8 h-1 rounded-full bg-primary/30"></div>
            <div className="w-12 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(90,240,179,0.4)]"></div>
            <div className="w-8 h-1 rounded-full bg-surface-container-highest"></div>
            <div className="w-8 h-1 rounded-full bg-surface-container-highest"></div>
          </div>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-white mb-6 leading-tight">
            Qual é o saldo atual da sua conta principal ou carteira?
          </h1>
          <div className="w-full bg-surface-container-high/40 backdrop-blur-md rounded-[2rem] p-8 md:p-12 mb-8 shadow-2xl border border-primary/10">
            <div className="flex flex-col items-center mb-10">
              <div className="flex items-baseline gap-2 bg-surface-container-highest/50 px-8 py-6 rounded-2xl border border-outline-variant/10 w-full">
                <span className="text-primary font-headline font-bold text-3xl opacity-60">R$</span>
                <input autoFocus className="bg-transparent border-none focus:ring-0 text-white font-headline font-extrabold text-5xl md:text-6xl w-full text-left placeholder:text-surface-bright outline-none" placeholder="0.00" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
              </div>
            </div>
            <div className="flex items-start gap-4 text-left p-5 rounded-xl bg-surface-container-low/50 border-l-4 border-primary/40">
              <span className="material-symbols-outlined text-primary text-2xl mt-0.5">account_balance_wallet</span>
              <div>
                <p className="text-on-surface font-medium text-sm mb-1">Criação de Carteira Geral</p>
                <p className="text-secondary text-xs leading-relaxed opacity-80">
                  Este valor será atribuído à sua 'Carteira Geral'. Você poderá vincular outras contas bancárias depois.
                </p>
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col gap-4">
            <button onClick={handleCreateAccount} disabled={loading} className="w-full py-5 px-8 bg-primary text-on-primary font-headline font-bold rounded-full text-lg hover:brightness-110 flex items-center justify-center gap-2">
              {loading ? "Salvando..." : "Continuar"} <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
            <button onClick={() => setStep(3)} className="w-full py-4 text-secondary font-medium text-sm hover:text-white transition-colors">
              Pular esta etapa
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- PASSO 3: RENDA MENSAL ---
  if (step === 3) {
    return (
      <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <main className="relative z-10 w-full max-w-xl px-6 py-12 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-8 h-1 rounded-full bg-primary/30"></div>
            <div className="w-8 h-1 rounded-full bg-primary/30"></div>
            <div className="w-12 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(90,240,179,0.4)]"></div>
            <div className="w-8 h-1 rounded-full bg-surface-container-highest"></div>
          </div>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-white mb-6 leading-tight">
            Quanto você espera receber este mês (Renda Total)?
          </h1>
          <div className="w-full bg-surface-container-high/40 backdrop-blur-md rounded-[2rem] p-8 md:p-12 mb-8 shadow-2xl border border-primary/10">
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-baseline gap-2 bg-surface-container-highest/50 px-8 py-6 rounded-2xl border border-outline-variant/10 w-full">
                <span className="text-primary font-headline font-bold text-3xl opacity-60">R$</span>
                <input autoFocus className="bg-transparent border-none focus:ring-0 text-white font-headline font-extrabold text-5xl md:text-6xl w-full text-left placeholder:text-surface-bright outline-none" placeholder="0.00" type="number" step="0.01" value={income} onChange={(e) => setIncome(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col gap-4">
            <button onClick={handleCreateIncome} disabled={loading} className="w-full py-5 px-8 bg-primary text-on-primary font-headline font-bold rounded-full text-lg hover:brightness-110 flex items-center justify-center gap-2">
              {loading ? "Calculando 50/30/20..." : "Continuar"} <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </button>
            <button onClick={() => setStep(4)} className="w-full py-4 text-secondary font-medium text-sm hover:text-white transition-colors">
              Pular esta etapa
            </button>
          </div>
        </main>
      </div>
    );
  }

  // --- PASSO 4: SUCESSO ---
  if (step === 4) {
    return (
      <div className="bg-surface text-on-surface font-body min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <main className="w-full max-w-2xl flex flex-col items-center space-y-12 z-10">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="relative bg-surface-container-high w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(90,240,179,0.15)] ring-1 ring-primary/20">
              <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <div className="text-center space-y-4">
            <h1 className="font-headline font-extrabold text-4xl md:text-5xl tracking-tight text-on-surface leading-tight">Tudo plantado!</h1>
            <p className="text-secondary text-lg md:text-xl max-w-md mx-auto leading-relaxed">
              Seu Broto está configurado com a regra <span className="text-primary font-semibold">50/30/20</span>.
            </p>
          </div>
          <div className="bg-surface-container-high/40 backdrop-blur-md w-full p-8 rounded-[2rem] border border-outline-variant/20 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xl">
            <div className="flex flex-col space-y-2 p-4 rounded-xl bg-surface-container-lowest/40">
              <span className="text-primary text-2xl font-headline font-bold">50%</span>
              <span className="text-secondary text-sm font-label uppercase tracking-widest">Necessidades</span>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full bg-primary w-1/2"></div></div>
            </div>
            <div className="flex flex-col space-y-2 p-4 rounded-xl bg-surface-container-lowest/40">
              <span className="text-primary text-2xl font-headline font-bold">30%</span>
              <span className="text-secondary text-sm font-label uppercase tracking-widest">Desejos</span>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full bg-primary w-[30%]"></div></div>
            </div>
            <div className="flex flex-col space-y-2 p-4 rounded-xl bg-surface-container-lowest/40">
              <span className="text-primary text-2xl font-headline font-bold">20%</span>
              <span className="text-secondary text-sm font-label uppercase tracking-widest">Poupança</span>
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden"><div className="h-full bg-primary w-[20%]"></div></div>
            </div>
          </div>
          <button onClick={onComplete} className="w-full max-w-sm bg-primary hover:bg-primary-container text-on-primary font-headline font-bold text-lg py-5 px-8 rounded-full transition-all flex items-center justify-center space-x-3 shadow-[0_10px_25px_-5px_rgba(90,240,179,0.4)] hover:scale-105">
            <span>Ir para o Dashboard</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </main>
      </div>
    );
  }

  return null;
}