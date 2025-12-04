import { useState } from "react";

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    const endpoint = isSignup ? "/auth/signup" : "/auth/login";
    try {
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (isSignup) {
        if (res.ok) {
          setMessage("✅ Conta criada! Faça login agora.");
          setIsSignup(false);
          setForm({ email: "", password: "" });
        } else {
          setMessage("❌ Erro ao criar conta. Email pode já estar em uso.");
        }
      } else {
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("token", data.token);
          onLogin(data.token);
        } else {
          setMessage("❌ Credenciais inválidas.");
        }
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage("❌ Erro de conexão.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Controle Financeiro
        </h1>
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-600">
          {isSignup ? "Criar Conta" : "Login"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded-lg"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 border rounded-lg"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
          >
            {isSignup ? "Criar Conta" : "Entrar"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <button
          onClick={() => {
            setIsSignup(!isSignup);
            setMessage("");
            setForm({ email: "", password: "" });
          }}
          className="w-full mt-4 text-blue-600 hover:text-blue-800 text-sm"
        >
          {isSignup
            ? "Já tem conta? Faça login"
            : "Não tem conta? Crie uma"}
        </button>
      </div>
    </div>
  );
}
