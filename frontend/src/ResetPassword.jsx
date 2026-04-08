import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Toast } from "./components/Toast";
import API_URL from "./config/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) {
      setToast({ show: true, message: "A senha deve ter no mínimo 6 caracteres", type: "error" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setToast({ show: true, message: "As senhas não coincidem", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        const text = await res.text();
        setToast({ show: true, message: text || "Token inválido ou expirado", type: "error" });
      }
    } catch {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  if (!token) {
    return (
      <div className="font-body bg-surface min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-secondary/30 mb-4">link_off</span>
          <p className="text-secondary font-medium">Link inválido.</p>
          <button onClick={() => navigate("/")} className="mt-4 text-primary hover:underline text-sm">Voltar ao login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-body bg-surface min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ backgroundImage: "radial-gradient(at 0% 0%, rgba(90, 240, 179, 0.1) 0px, transparent 50%)" }}>
      <main className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-surface-container-high rounded-full">
            <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
          <h1 className="font-headline font-extrabold text-3xl tracking-tight text-white mb-2">
            {done ? "Senha redefinida!" : "Nova senha"}
          </h1>
          <p className="text-secondary text-sm">
            {done ? "Sua senha foi atualizada com sucesso." : "Escolha uma nova senha para sua conta."}
          </p>
        </div>

        <div className="bg-surface-container-highest/40 backdrop-blur-xl border border-primary/10 p-8 rounded-[2rem] shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">check_circle</span>
              </div>
              <p className="text-secondary text-sm">Agora você pode entrar com sua nova senha.</p>
              <button onClick={() => navigate("/")} className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline font-bold py-4 rounded-xl transition-all active:scale-95">
                Ir para o login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-widest text-secondary opacity-70 ml-1">Nova Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 text-xl">lock</span>
                  <input className="w-full bg-surface-container-high border-none text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all placeholder:text-secondary/30 outline-none" placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-widest text-secondary opacity-70 ml-1">Confirmar Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 text-xl">verified_user</span>
                  <input className="w-full bg-surface-container-high border-none text-on-surface rounded-xl py-4 pl-12 pr-4 focus:ring-1 focus:ring-primary/40 focus:bg-surface-bright transition-all placeholder:text-secondary/30 outline-none" placeholder="••••••••" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(90,240,179,0.2)] active:scale-95 transition-all">
                Redefinir senha
              </button>
            </form>
          )}
        </div>
      </main>

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}
