import { useState, useEffect } from "react";
import { Toast } from "./components/Toast";
import API_URL from "./config/api";

export default function Login({ onLogin, onSignupSuccess }) {
  const [view, setView] = useState("login"); // "login" | "signup" | "forgot" | "forgot_sent"
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("session_expired") === "true") {
      localStorage.removeItem("session_expired");
      setToast({ show: true, message: "Sua sessão expirou. Faça login novamente.", type: "error" });
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSignup) {
      if (form.password.length < 6) {
        setToast({ show: true, message: "A senha deve ter no mínimo 6 caracteres", type: "error" });
        return;
      }
      if (form.password !== form.confirmPassword) {
        setToast({ show: true, message: "As senhas não coincidem", type: "error" });
        return;
      }
      if (!form.fullName.trim()) {
        setToast({ show: true, message: "Nome completo é obrigatório", type: "error" });
        return;
      }
    }

    const endpoint = isSignup ? "/auth/signup" : "/auth/login";
    
    // Divide o Nome Completo em First Name e Last Name pro Backend em Go
    const nameParts = form.fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || " ";

    const payload = isSignup
      ? { email: form.email, password: form.password, first_name: firstName, last_name: lastName }
      : { email: form.email, password: form.password };

    try {
      const apiUrl = API_URL;
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (isSignup) {
        if (res.ok) {
          // Após cadastrar com sucesso, já faz o login automático para ir pro Onboarding
          const loginRes = await fetch(`${apiUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, password: form.password }),
          });
          
          if (loginRes.ok) {
            const data = await loginRes.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("firstName", data.first_name);
            localStorage.setItem("lastName", data.last_name);
            // Indica pro App.jsx que é um usuário novo precisando de onboarding
            localStorage.setItem("needsOnboarding", "true"); 
            onLogin(data.token);
          }
        } else {
          setToast({ show: true, message: "Erro ao criar conta. Email já em uso?", type: "error" });
        }
      } else {
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("firstName", data.first_name);
          localStorage.setItem("lastName", data.last_name);
          onLogin(data.token);
        } else {
          setToast({ show: true, message: "Credenciais inválidas", type: "error" });
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      // Sempre mostra confirmação (não revela se email existe)
      setView("forgot_sent");
    } catch {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  // TELA — LINK ENVIADO
  if (view === "forgot_sent") {
    return (
      <div className="font-body bg-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(at 0% 0%, rgba(90, 240, 179, 0.1) 0px, transparent 50%)" }}>
        <main className="w-full max-w-md z-10 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-primary/10 rounded-full">
            <span className="material-symbols-outlined text-primary text-4xl">mark_email_read</span>
          </div>
          <h2 className="font-headline font-extrabold text-3xl text-white mb-3">Verifique seu email</h2>
          <p className="text-secondary mb-2">Se o endereço <span className="text-white font-medium">{forgotEmail}</span> estiver cadastrado, você receberá um link em breve.</p>
          <p className="text-secondary/60 text-sm mb-8">O link expira em 1 hora. Verifique também a caixa de spam.</p>
          <button onClick={() => setView("login")} className="text-primary font-semibold hover:underline">
            Voltar para o login
          </button>
        </main>
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
      </div>
    );
  }

  // TELA — ESQUECI MINHA SENHA
  if (view === "forgot") {
    return (
      <div className="font-body bg-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(at 0% 0%, rgba(90, 240, 179, 0.1) 0px, transparent 50%)" }}>
        <main className="w-full max-w-md z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-surface-container-high rounded-full">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock_reset</span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl tracking-tight text-white mb-2">Esqueceu a senha?</h1>
            <p className="text-secondary text-sm">Digite seu email e enviaremos um link para redefinir sua senha.</p>
          </div>

          <div className="bg-surface-container-highest/40 backdrop-blur-xl border border-primary/10 p-8 rounded-[2rem] shadow-2xl">
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-widest text-secondary opacity-70 ml-1">E-mail</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 text-xl">mail</span>
                  <input className="w-full bg-surface-container-high border-none text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all placeholder:text-secondary/30 outline-none" placeholder="seu@email.com" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(90,240,179,0.2)] active:scale-95 transition-all">
                Enviar link
              </button>
            </form>
            <div className="mt-6 text-center">
              <button onClick={() => setView("login")} className="text-secondary text-sm hover:text-primary transition-colors">
                ← Voltar para o login
              </button>
            </div>
          </div>
        </main>
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
      </div>
    );
  }

  // TELA DE CADASTRO
  if (isSignup) {
    return (
      <div className="font-body text-on-surface bg-surface min-h-screen flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-primary-container/5 blur-[100px] rounded-full pointer-events-none"></div>
        
        <main className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="hidden lg:flex flex-col space-y-8 pr-12">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              <span className="font-headline font-extrabold text-primary text-2xl tracking-tight">ProsperFlow</span>
            </div>
            <div className="space-y-4">
              <h1 className="font-headline text-5xl font-extrabold text-on-surface leading-tight tracking-tight">Crie sua conta</h1>
              <p className="text-secondary text-xl font-light max-w-md">Comece sua jornada para a liberdade financeira hoje. Acompanhe seus investimentos e gastos com a sofisticação que você merece.</p>
            </div>
            <div className="relative w-full aspect-square max-w-sm">
              <div className="absolute inset-0 bg-surface-container-highest/40 backdrop-blur-md border border-primary/10 rounded-3xl rotate-3 opacity-50"></div>
              <div className="absolute inset-0 bg-surface-container-highest/40 backdrop-blur-md rounded-3xl -rotate-3 border border-primary/20 flex items-center justify-center overflow-hidden">
                <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-primary to-primary-container opacity-20 blur-3xl"></div>
                <span className="material-symbols-outlined text-primary/40 text-[120px]">insights</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="bg-surface-container-highest/40 backdrop-blur-md border border-primary/10 w-full max-w-[480px] p-8 md:p-10 rounded-[2rem] shadow-2xl">
              <div className="lg:hidden mb-8 text-center">
                <div className="flex justify-center items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                </div>
                <h2 className="font-headline text-3xl font-bold text-on-surface mb-2">Crie sua conta</h2>
                <p className="text-secondary text-sm">Comece sua jornada para a liberdade financeira hoje</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-secondary tracking-widest uppercase ml-1">Nome Completo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary/50 text-xl">person</span>
                    <input className="w-full bg-surface-container-high border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-secondary/30 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all outline-none" placeholder="Ex: André Silva" type="text" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-secondary tracking-widest uppercase ml-1">E-mail</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary/50 text-xl">mail</span>
                    <input className="w-full bg-surface-container-high border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-secondary/30 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all outline-none" placeholder="nome@exemplo.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-secondary tracking-widest uppercase ml-1">Senha</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary/50 text-xl">lock</span>
                    <input className="w-full bg-surface-container-high border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-secondary/30 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all outline-none" placeholder="••••••••" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-secondary tracking-widest uppercase ml-1">Confirmar Senha</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary/50 text-xl">verified_user</span>
                    <input className="w-full bg-surface-container-high border-none rounded-xl py-3.5 pl-12 pr-4 text-on-surface placeholder:text-secondary/30 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all outline-none" placeholder="••••••••" type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold py-4 rounded-full shadow-[0_0_20px_rgba(90,240,179,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 group">
                  <span>Criar Conta</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </form>

              <div className="mt-10 text-center">
                <p className="text-secondary text-sm">
                  Já possui uma conta? <button type="button" onClick={() => setIsSignup(false)} className="text-primary font-semibold hover:underline ml-1 transition-all">Acessar login</button>
                </p>
              </div>
            </div>
          </div>
        </main>
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
      </div>
    );
  }

  // TELA DE LOGIN
  return (
    <div className="font-body bg-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(at 0% 0%, rgba(90, 240, 179, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(52, 211, 153, 0.05) 0px, transparent 50%)" }}>
      <main className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-surface-container-high rounded-full shadow-[0_0_40px_rgba(90,240,179,0.1)]">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <h1 className="font-headline font-extrabold text-4xl tracking-tight text-primary mb-2">ProsperFlow</h1>
          <p className="font-body text-secondary text-base opacity-80">A sua saúde financeira em um só lugar</p>
        </div>

        <div className="bg-surface-container-highest/40 backdrop-blur-xl border border-primary/10 p-8 rounded-[2rem] shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-widest text-secondary opacity-70 ml-1">E-mail</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 text-xl">mail</span>
                <input className="w-full bg-surface-container-high border-none text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all placeholder:text-secondary/30 outline-none" placeholder="seu@email.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-xs font-medium uppercase tracking-widest text-secondary opacity-70">Senha</label>
                <button type="button" onClick={() => setView("forgot")} className="text-xs text-primary/70 hover:text-primary transition-colors">
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 text-xl">lock</span>
                <input className="w-full bg-surface-container-high border-none text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all placeholder:text-secondary/30 outline-none" placeholder="••••••••" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </div>
            </div>

            <button type="submit" className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(90,240,179,0.2)] active:scale-95 transition-all duration-200 mt-2">
              Entrar
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-secondary text-sm">
              Não tem uma conta? <button type="button" onClick={() => { setIsSignup(true); setForm({ email: "", password: "", confirmPassword: "", fullName: "" }); }} className="text-primary font-bold ml-1 hover:underline underline-offset-4 decoration-primary/30 transition-all">Criar Conta</button>
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 opacity-40">
          <span className="material-symbols-outlined text-sm">verified_user</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary">Ambiente seguro & criptografado</span>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-secondary-container/10 rounded-full blur-[100px]"></div>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}