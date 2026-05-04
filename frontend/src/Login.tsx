import { useState, useEffect } from "react";
import { Toast } from "./components/Toast";
import { BrotoLogo } from "./components/BrotoLogo";
import { Icon } from "./components/Icon";
import API_URL from "./config/api";
import type { Toast as ToastState } from "./types";

interface LoginProps { onLogin: (token: string) => void; }

const B = {
  field: {
    background: "var(--b-surface)",
    border: "1px solid var(--b-border-strong)",
    borderRadius: 16,
    padding: "12px 14px",
    display: "flex" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 12,
  } as React.CSSProperties,
};

function AuthField({ label, type = "text", value, onChange, icon, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  icon: string; placeholder: string;
}) {
  return (
    <div style={B.field}>
      <Icon name={icon} size={18} color="var(--b-muted)" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "var(--b-muted)", fontWeight: 500 }}>{label}</div>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          style={{
            background: "none", border: "none", outline: "none",
            fontSize: 14, color: "var(--b-text)", fontWeight: 500,
            width: "100%", padding: 0, fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}

export default function Login({ onLogin }: LoginProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [view, setView] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", fullName: "" });
  const [forgotEmail, setForgotEmail] = useState("");
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" });

  useEffect(() => {
    if (localStorage.getItem("session_expired") === "true") {
      localStorage.removeItem("session_expired");
      setToast({ show: true, message: "Sua sessão expirou. Faça login novamente.", type: "error" });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSignup) {
      if (form.password.length < 6) return setToast({ show: true, message: "A senha deve ter no mínimo 6 caracteres", type: "error" });
      if (form.password !== form.confirmPassword) return setToast({ show: true, message: "As senhas não coincidem", type: "error" });
      if (!form.fullName.trim()) return setToast({ show: true, message: "Nome completo é obrigatório", type: "error" });
    }

    const nameParts = form.fullName.trim().split(" ");
    const payload = isSignup
      ? { email: form.email, password: form.password, first_name: nameParts[0] || "", last_name: nameParts.slice(1).join(" ") || " " }
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(`${API_URL}${isSignup ? "/auth/signup" : "/auth/login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (isSignup) {
        if (res.ok) {
          const lr = await fetch(`${API_URL}/auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: form.email, password: form.password }),
          });
          if (lr.ok) {
            const d = await lr.json();
            localStorage.setItem("token", d.token);
            localStorage.setItem("firstName", d.first_name);
            localStorage.setItem("lastName", d.last_name);
            localStorage.setItem("needsOnboarding", "true");
            onLogin(d.token);
          }
        } else { setToast({ show: true, message: "Erro ao criar conta. Email já em uso?", type: "error" }); }
      } else {
        if (res.ok) {
          const d = await res.json();
          localStorage.setItem("token", d.token);
          localStorage.setItem("firstName", d.first_name);
          localStorage.setItem("lastName", d.last_name);
          onLogin(d.token);
        } else { setToast({ show: true, message: "Credenciais inválidas", type: "error" }); }
      }
    } catch { setToast({ show: true, message: "Erro de conexão", type: "error" }); }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setView("forgot_sent");
    } catch { setToast({ show: true, message: "Erro de conexão", type: "error" }); }
  }

  const wrap = (content: React.ReactNode) => (
    <div style={{
      minHeight: "100vh", background: "var(--b-bg)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px", position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: -60, left: -40, width: 280, height: 280, borderRadius: 999,
        background: "radial-gradient(circle, rgba(127,224,160,0.18), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        {content}
      </div>
      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );

  // Link sent
  if (view === "forgot_sent") return wrap(
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 80, height: 80, borderRadius: 999, margin: "0 auto 24px",
        background: "var(--b-primary-soft)", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="mark_email_read" size={36} color="var(--b-primary)" />
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8 }}>Verifique seu email</h2>
      <p style={{ color: "var(--b-muted)", lineHeight: 1.5, marginBottom: 24 }}>
        Se <strong style={{ color: "var(--b-text)" }}>{forgotEmail}</strong> estiver cadastrado,<br/>
        você receberá um link em breve.
      </p>
      <button onClick={() => setView("login")} style={{ color: "var(--b-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
        ← Voltar para o login
      </button>
    </div>
  );

  // Forgot password
  if (view === "forgot") return wrap(
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
        <BrotoLogo size={28} withWordmark />
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, marginBottom: 6 }}>Esqueceu a senha?</h2>
      <p style={{ color: "var(--b-muted)", fontSize: 14, marginBottom: 28 }}>
        Digite seu email e enviaremos um link para redefinir sua senha.
      </p>
      <form onSubmit={handleForgotPassword}>
        <AuthField label="Email" icon="mail" placeholder="seu@email.com" type="email" value={forgotEmail} onChange={setForgotEmail} />
        <button type="submit" style={{
          width: "100%", padding: "14px", background: "var(--b-primary)", color: "var(--b-primary-ink)",
          border: "none", borderRadius: 18, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8,
        }}>Enviar link</button>
      </form>
      <button onClick={() => setView("login")} style={{ marginTop: 20, color: "var(--b-muted)", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>
        ← Voltar para o login
      </button>
    </>
  );

  return wrap(
    <>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 52 }}>
        <BrotoLogo size={32} withWordmark />
      </div>

      {/* Headline */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.6, lineHeight: 1.1, marginBottom: 6 }}>
          {isSignup ? "Plante a primeira semente." : "Cuide do que\nvocê planta."}
        </h1>
        <p style={{ fontSize: 14, color: "var(--b-muted)", lineHeight: 1.4 }}>
          {isSignup
            ? "Crie sua conta e comece a controlar suas finanças."
            : "Entre para continuar plantando suas\nconquistas financeiras."}
        </p>
      </div>

      {/* Toggle */}
      <div style={{
        display: "flex", padding: 4, marginBottom: 20,
        background: "var(--b-surface)", borderRadius: 999,
        border: "1px solid var(--b-border)",
      }}>
        {(["login", "signup"] as const).map((tab) => {
          const active = isSignup ? tab === "signup" : tab === "login";
          return (
            <button key={tab} onClick={() => setIsSignup(tab === "signup")} style={{
              flex: 1, padding: "10px", textAlign: "center",
              background: active ? "var(--b-primary)" : "transparent",
              color: active ? "var(--b-primary-ink)" : "var(--b-muted)",
              borderRadius: 999, fontSize: 13, fontWeight: active ? 700 : 600,
              border: "none", cursor: "pointer", transition: "all .15s",
            }}>{tab === "login" ? "Entrar" : "Criar conta"}</button>
          );
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <AuthField label="Nome completo" icon="person" placeholder="Ex: André Silva" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} />
        )}
        <AuthField label="Email" icon="mail" placeholder="seu@email.com" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
        <AuthField label="Senha" icon="lock" placeholder="••••••••" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} />
        {isSignup && (
          <AuthField label="Confirmar senha" icon="lock" placeholder="••••••••" type="password" value={form.confirmPassword} onChange={v => setForm({ ...form, confirmPassword: v })} />
        )}

        {!isSignup && (
          <div style={{ textAlign: "right", marginBottom: 20 }}>
            <button type="button" onClick={() => setView("forgot")} style={{ fontSize: 12, color: "var(--b-primary)", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              Esqueci minha senha
            </button>
          </div>
        )}

        <button type="submit" style={{
          width: "100%", padding: "16px", background: "var(--b-primary)", color: "var(--b-primary-ink)",
          border: "none", borderRadius: 18, fontSize: 15, fontWeight: 700, cursor: "pointer",
          marginBottom: 16, marginTop: isSignup ? 8 : 0,
        }}>{isSignup ? "Criar conta" : "Entrar"}</button>
      </form>

      <div style={{ textAlign: "center", fontSize: 12, color: "var(--b-muted)" }}>
        {isSignup
          ? <>Já tem conta? <button onClick={() => setIsSignup(false)} style={{ color: "var(--b-primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Entrar</button></>
          : <>Novo no Broto? <button onClick={() => setIsSignup(true)} style={{ color: "var(--b-primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Plante a primeira semente</button></>
        }
      </div>
    </>
  );
}
