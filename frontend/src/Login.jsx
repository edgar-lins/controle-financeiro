import { useState } from "react";
import { HiEye, HiEyeOff, HiCurrencyDollar, HiShieldCheck } from "react-icons/hi";
import { Toast } from "./components/Toast";

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    // Validação de senha no signup
    if (isSignup) {
      if (form.password.length < 6) {
        setToast({ show: true, message: "A senha deve ter no mínimo 6 caracteres", type: "error" });
        return;
      }
      if (form.password !== form.confirmPassword) {
        setToast({ show: true, message: "As senhas não coincidem", type: "error" });
        return;
      }
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setToast({ show: true, message: "Nome e sobrenome são obrigatórios", type: "error" });
        return;
      }
    }

    const endpoint = isSignup ? "/auth/signup" : "/auth/login";
    const payload = isSignup
      ? { email: form.email, password: form.password, first_name: form.firstName, last_name: form.lastName }
      : { email: form.email, password: form.password };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (isSignup) {
        if (res.ok) {
          setToast({ show: true, message: "Conta criada! Faça login agora.", type: "success" });
          setIsSignup(false);
          setForm({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" });
        } else {
          setToast({ show: true, message: "Erro ao criar conta. Email pode já estar em uso.", type: "error" });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Login Card */}
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <HiCurrencyDollar className="text-cyan-400 text-7xl" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            FinControl
          </h1>
          <p className="text-gray-400">Seu controle financeiro simplificado</p>
        </div>

        {/* Form Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-6">
          {isSignup ? "Criar Conta" : "Bem-vindo!"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
                  <input
                    type="text"
                    placeholder="João"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Sobrenome</label>
                  <input
                    type="text"
                    placeholder="Silva"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition pr-12"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xl"
              >
                {showPassword ? <HiEyeOff /> : <HiEye />}
              </button>
            </div>
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Senha</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition pr-12"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xl"
                >
                  {showConfirmPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-lg mt-6"
          >
            {isSignup ? "Criar Conta" : "Entrar"}
          </button>
        </form>

        {/* Toggle */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-center text-gray-400 text-sm mb-3">
            {isSignup
              ? "Já tem uma conta?"
              : "Não tem uma conta?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setToast({ show: false, message: "", type: "success" });
              setForm({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" });
              setShowPassword(false);
              setShowConfirmPassword(false);
            }}
            className="w-full bg-white/10 hover:bg-white/20 text-cyan-400 hover:text-cyan-300 font-semibold py-2 rounded-lg transition duration-200 border border-white/10"
          >
            {isSignup ? "Fazer Login" : "Criar Conta"}
          </button>
        </div>

        {/* Footer */}
        <p className="flex items-center justify-center gap-2 text-gray-500 text-xs mt-6">
          <HiShieldCheck className="text-sm" />
          Seus dados estão protegidos
        </p>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: "", type: "success" })}
        />
      )}
    </div>
  );
}
