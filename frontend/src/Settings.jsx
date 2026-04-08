import { useEffect, useState } from "react";
import { Toast } from "./components/Toast";
import API_URL from "./config/api";

export default function Settings() {
  const [preferences, setPreferences] = useState({
    expenses_percent: 50,
    entertainment_percent: 30,
    investment_percent: 20,
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const firstName = localStorage.getItem("firstName") || "Usuário";
  const lastName = localStorage.getItem("lastName") || "";
  const fullName = `${firstName} ${lastName}`.trim();

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/preferences`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error("Erro ao buscar preferências:", error);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("firstName");
    localStorage.removeItem("lastName");
    localStorage.removeItem("needsOnboarding");
    // Força o reload da página para o App.jsx redirecionar pro Login
    window.location.href = "/";
  }

  function handleProClick() {
    setToast({ show: true, message: "A assinatura PRO estará disponível em breve!", type: "error" });
  }

  async function handleDeleteAccount() {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        localStorage.clear();
        window.location.href = "/";
      } else {
        setToast({ show: true, message: "Erro ao excluir conta. Tente novamente.", type: "error" });
        setDeleteModal(false);
      }
    } catch {
      setToast({ show: true, message: "Erro de conexão", type: "error" });
    }
  }

  return (
    <div className="space-y-12 animate-fade-in relative z-10 pb-10">
      {/* Header */}
      <header className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-headline">Configurações</h2>
        <p className="text-secondary/60 font-medium">Gerencie seu perfil e as preferências da sua conta.</p>
      </header>

      {/* User Profile Section */}
      <section>
        <h3 className="text-lg font-headline font-bold text-on-surface mb-6 ml-2">Perfil do Usuário</h3>
        <div className="bg-surface-container-low/60 backdrop-blur-md rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-outline-variant/10 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-surface-container-highest border-2 border-primary/20 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-4xl text-primary opacity-80">person</span>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-1.5 rounded-lg shadow-lg">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            </div>
            <div>
              <h4 className="text-2xl font-headline font-extrabold text-white tracking-tight">{fullName}</h4>
              <p className="text-secondary font-body mt-1">Conta Gratuita</p>
              <div className="flex gap-2 mt-3">
                <span className="px-2 py-1 bg-surface-container-highest text-slate-400 text-[10px] font-bold uppercase rounded">ID: {Math.floor(Math.random() * 900000) + 100000}</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded">Ativo</span>
              </div>
            </div>
          </div>
          <button onClick={handleProClick} className="w-full md:w-auto px-6 py-3 bg-surface-container-high hover:bg-surface-bright text-on-surface text-sm font-semibold rounded-full border border-white/5 transition-all duration-300">
            Editar Perfil
          </button>
        </div>
      </section>

      {/* 50/30/20 Rule Section */}
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-lg font-headline font-bold text-on-surface">Regra 50/30/20</h3>
          <span className="text-xs text-slate-500 font-medium">Orçamento Atual</span>
        </div>
        <div className="bg-surface-container-low/60 backdrop-blur-md rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border border-outline-variant/10 shadow-lg">
          
          {/* Needs */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-headline text-white">Necessidades</span>
                <span className="material-symbols-outlined text-slate-500 text-xs">lock</span>
              </div>
              <span className="text-primary font-bold">{preferences.expenses_percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-lg relative">
              <div className="absolute top-0 left-0 h-full bg-primary rounded-lg" style={{ width: `${preferences.expenses_percent}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow" style={{ left: `calc(${preferences.expenses_percent}% - 8px)` }}></div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Fixos</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">PRO</span>
            </div>
          </div>

          {/* Wants */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-headline text-white">Desejos</span>
                <span className="material-symbols-outlined text-slate-500 text-xs">lock</span>
              </div>
              <span className="text-primary font-bold">{preferences.entertainment_percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-lg relative">
              <div className="absolute top-0 left-0 h-full bg-primary/70 rounded-lg" style={{ width: `${preferences.entertainment_percent}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow" style={{ left: `calc(${preferences.entertainment_percent}% - 8px)` }}></div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Variáveis</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">PRO</span>
            </div>
          </div>

          {/* Savings */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-headline text-white">Poupança</span>
                <span className="material-symbols-outlined text-slate-500 text-xs">lock</span>
              </div>
              <span className="text-primary font-bold">{preferences.investment_percent}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-lg relative">
              <div className="absolute top-0 left-0 h-full bg-primary/40 rounded-lg" style={{ width: `${preferences.investment_percent}%` }}></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow" style={{ left: `calc(${preferences.investment_percent}% - 8px)` }}></div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Futuro</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">PRO</span>
            </div>
          </div>

        </div>
        <p className="text-xs text-secondary/60 mt-4 px-2 italic text-center md:text-left">
          * A alteração das porcentagens da regra 50/30/20 é um benefício exclusivo do plano PRO.
        </p>
      </section>

      {/* PRO Card Section */}
      <section>
        <div className="bg-[rgba(19,27,46,0.6)] backdrop-blur-xl rounded-[2rem] overflow-hidden relative border border-emerald-500/20 group shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 blur-[100px] rounded-full group-hover:bg-emerald-500/30 transition-all duration-700"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full"></div>
          
          <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-on-primary rounded-full mb-6 shadow-sm">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                <span className="text-[10px] font-black uppercase tracking-wider">ProsperFlow PRO</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-white mb-4 leading-tight tracking-tighter">Desbloqueie o potencial máximo</h2>
              <p className="text-secondary max-w-md mb-8 leading-relaxed">Eleve sua gestão financeira com recursos analíticos avançados e personalização sem limites.</p>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 mb-10">
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  <span className="text-sm">Sliders customizáveis</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  <span className="text-sm">Relatórios em PDF</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  <span className="text-sm">Contas Compartilhadas</span>
                </li>
                <li className="flex items-center gap-3 text-slate-200">
                  <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
                  <span className="text-sm">Suporte Prioritário</span>
                </li>
              </ul>
              
              <button onClick={handleProClick} className="w-full md:w-auto px-10 py-4 bg-primary text-on-primary font-black font-headline text-lg rounded-full hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_30px_rgba(90,240,179,0.3)]">
                Assinar PRO agora
              </button>
            </div>
            
            <div className="hidden md:block w-1/3 relative">
              <div className="aspect-square rounded-full border border-emerald-500/10 flex items-center justify-center p-8 shadow-inner">
                <div className="aspect-square w-full rounded-full bg-emerald-500/5 backdrop-blur-3xl flex items-center justify-center border border-white/5 shadow-[0_0_50px_rgba(90,240,179,0.1)]">
                  <span className="material-symbols-outlined text-7xl text-emerald-400 opacity-80" style={{ fontVariationSettings: "'wght' 200" }}>rocket_launch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Action (Logout) */}
      <footer className="pt-4 flex justify-center md:justify-end">
        <button onClick={handleLogout} className="flex items-center justify-center w-full md:w-auto gap-3 px-8 py-4 text-error bg-error-container/10 hover:bg-error-container/20 border border-error/20 transition-all duration-300 rounded-2xl font-bold group">
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">logout</span>
          <span>Sair da Conta</span>
        </button>
      </footer>

      {/* Zona de Perigo */}
      <section>
        <h3 className="text-lg font-headline font-bold text-red-400/80 mb-6 ml-2">Zona de Perigo</h3>
        <div className="bg-surface-container-low/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-red-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-white font-semibold mb-1">Excluir minha conta</p>
            <p className="text-secondary/60 text-sm">Remove permanentemente sua conta e todos os dados associados. Essa ação não pode ser desfeita.</p>
          </div>
          <button
            onClick={() => { setDeleteModal(true); setDeleteConfirmText(""); }}
            className="flex-shrink-0 px-6 py-3 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl transition-colors"
          >
            Excluir conta
          </button>
        </div>
      </section>

      {/* Modal de confirmação de exclusão */}
      {deleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm" onClick={() => setDeleteModal(false)}></div>
          <div className="relative bg-[#131b2e] border border-red-500/20 shadow-2xl rounded-[2rem] w-full max-w-md p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-400">warning</span>
              </div>
              <h3 className="font-headline text-xl font-bold text-white">Excluir conta</h3>
            </div>
            <p className="text-secondary/80 text-sm mb-2">Todos os seus dados serão removidos permanentemente:</p>
            <ul className="text-secondary/60 text-sm mb-6 space-y-1 ml-4 list-disc">
              <li>Gastos e rendas</li>
              <li>Contas e transferências</li>
              <li>Metas financeiras</li>
            </ul>
            <p className="text-sm text-white mb-2">Digite <span className="font-mono font-bold text-red-400">CONFIRMAR</span> para continuar:</p>
            <input
              type="text"
              className="w-full bg-surface-container-highest/40 border border-red-500/20 text-white rounded-xl p-3.5 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all mb-6"
              placeholder="CONFIRMAR"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)} className="flex-1 py-3.5 rounded-xl font-bold text-secondary bg-surface-container-high hover:bg-surface-container-highest transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "CONFIRMAR"}
                className="flex-1 py-3.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: "", type: "success" })} />}
    </div>
  );
}