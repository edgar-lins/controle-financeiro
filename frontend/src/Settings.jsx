import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiCheckCircle, HiXCircle, HiHome, HiSparkles, HiTrendingUp, HiChartBar } from "react-icons/hi";
import { Toast } from "./components/Toast";

export default function Settings() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    expenses_percent: 50,
    entertainment_percent: 30,
    investment_percent: 20,
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPreferences(data);
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro ao carregar preferências", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    // Validação
    const total = preferences.expenses_percent + preferences.entertainment_percent + preferences.investment_percent;
    if (Math.abs(total - 100) > 0.01) {
      setToast({ show: true, message: `Total deve ser 100%, atual: ${total.toFixed(2)}%`, type: "error" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expenses_percent: preferences.expenses_percent,
          entertainment_percent: preferences.entertainment_percent,
          investment_percent: preferences.investment_percent,
        }),
      });

      if (res.ok) {
        setToast({ show: true, message: "Preferências atualizadas com sucesso!", type: "success" });
        setTimeout(() => navigate("/"), 1500);
      } else {
        const error = await res.text();
        setToast({ show: true, message: error || "Erro ao atualizar preferências", type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  function handleReset() {
    setPreferences({
      expenses_percent: 50,
      entertainment_percent: 30,
      investment_percent: 20,
    });
  }

  const total = preferences.expenses_percent + preferences.entertainment_percent + preferences.investment_percent;
  const isValid = Math.abs(total - 100) < 0.01;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-cyan-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-white">Configurações</h1>
          </div>
          <p className="text-gray-400">Personalize sua distribuição financeira</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSave}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <HiChartBar className="text-3xl text-cyan-400" />
            <h2 className="text-2xl font-bold text-white">
              Distribuição {preferences.expenses_percent.toFixed(0)} / {preferences.entertainment_percent.toFixed(0)} / {preferences.investment_percent.toFixed(0)}
            </h2>
          </div>
          <p className="text-gray-400 mb-8 text-sm">
            Ajuste as porcentagens para adequar ao seu planejamento financeiro. O total deve ser 100%.
          </p>

          {/* Despesas Fixas */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <HiHome className="text-2xl text-cyan-400" />
              Despesas Fixas (Moradia, Alimentação, Transporte)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={preferences.expenses_percent}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    expenses_percent: parseFloat(e.target.value) || 0,
                  })
                }
                className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-cyan-400 font-bold text-xl w-16 text-right">
                {preferences.expenses_percent.toFixed(2)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-600 transition-all"
                style={{ width: `${preferences.expenses_percent}%` }}
              ></div>
            </div>
          </div>

          {/* Lazer e Diversão */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <HiSparkles className="text-2xl text-emerald-400" />
              Lazer & Diversão (Entretenimento, Hobbies, Viagens)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={preferences.entertainment_percent}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    entertainment_percent: parseFloat(e.target.value) || 0,
                  })
                }
                className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-emerald-400 font-bold text-xl w-16 text-right">
                {preferences.entertainment_percent.toFixed(2)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${preferences.entertainment_percent}%` }}
              ></div>
            </div>
          </div>

          {/* Investimentos */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-white font-semibold mb-3">
              <HiTrendingUp className="text-2xl text-purple-400" />
              Investimentos (Poupança, Aplicações, Aposentadoria)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={preferences.investment_percent}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    investment_percent: parseFloat(e.target.value) || 0,
                  })
                }
                className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-violet-400 font-bold text-xl w-16 text-right">
                {preferences.investment_percent.toFixed(2)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 transition-all"
                style={{ width: `${preferences.investment_percent}%` }}
              ></div>
            </div>
          </div>

          {/* Total */}
          <div className="mb-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Total</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${isValid ? "text-emerald-400" : "text-red-400"}`}>
                  {total.toFixed(2)}%
                </span>
                {isValid ? (
                  <HiCheckCircle className="text-2xl text-emerald-400" />
                ) : (
                  <HiXCircle className="text-2xl text-red-400" />
                )}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              Salvar Configurações
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition duration-200"
            >
              Padrão (50/30/20)
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-600/20 border border-blue-600/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            💡 <strong>Dica:</strong> Você pode personalizar as porcentagens conforme sua realidade financeira.
            Por exemplo: 60/25/15 para quem tem despesas altas, ou 40/30/30 para quem quer investir mais.
          </p>
        </div>
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
