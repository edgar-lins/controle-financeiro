import { HiHome, HiShoppingCart, HiTruck, HiLightningBolt, HiHeart, HiAcademicCap, HiSparkles, HiShoppingBag, HiTrendingUp, HiCreditCard } from "react-icons/hi";
import { MdDirectionsBus, MdDirectionsCar, MdCardGiftcard, MdVolunteerActivism } from "react-icons/md";

export const CATEGORIES = [
  { value: "moradia", label: "Moradia", icon: HiHome, color: "text-blue-400", description: "Aluguel, condomínio, IPTU" },
  { value: "alimentacao", label: "Alimentação", icon: HiShoppingCart, color: "text-green-400", description: "Mercado, feira" },
  { value: "transporte", label: "Transporte", icon: MdDirectionsBus, color: "text-yellow-400", description: "Combustível, transporte público" },
  { value: "contas", label: "Contas", icon: HiLightningBolt, color: "text-orange-400", description: "Água, luz, internet" },
  { value: "saude", label: "Saúde", icon: HiHeart, color: "text-red-400", description: "Plano, remédios, consultas" },
  { value: "educacao", label: "Educação", icon: HiAcademicCap, color: "text-indigo-400", description: "Cursos, livros, escola" },
  { value: "lazer", label: "Lazer", icon: HiSparkles, color: "text-purple-400", description: "Cinema, shows, hobbies" },
  { value: "restaurantes", label: "Restaurantes", icon: HiShoppingCart, color: "text-pink-400", description: "Restaurantes, delivery" },
  { value: "streaming", label: "Streaming", icon: HiAcademicCap, color: "text-cyan-400", description: "Netflix, Spotify, etc" },
  { value: "compras", label: "Compras", icon: HiShoppingBag, color: "text-teal-400", description: "Roupas, eletrônicos" },
  { value: "viagens", label: "Viagens", icon: MdDirectionsCar, color: "text-sky-400", description: "Férias, passeios" },
  { value: "pets", label: "Pets", icon: HiHeart, color: "text-amber-400", description: "Veterinário, ração" },
  { value: "presentes", label: "Presentes", icon: MdCardGiftcard, color: "text-red-300", description: "Presentes e doações" },
  { value: "doacoes", label: "Doações", icon: MdVolunteerActivism, color: "text-orange-300", description: "Doações beneficentes" },
  { value: "investimentos", label: "Investimentos", icon: HiTrendingUp, color: "text-emerald-400", description: "Ações, fundos, CDB" },
  { value: "poupanca", label: "Poupança", icon: HiTrendingUp, color: "text-lime-400", description: "Reserva de emergência" },
  { value: "previdencia", label: "Previdência", icon: HiAcademicCap, color: "text-violet-400", description: "Aposentadoria" },
  { value: "dividas", label: "Dívidas", icon: HiCreditCard, color: "text-rose-400", description: "Pagamento de dívidas" },
  { value: "outros", label: "Outros", icon: HiShoppingBag, color: "text-gray-400", description: "Outros gastos" },
];

const GROUPS = [
  { value: "essencial", label: "Essenciais", color: "text-blue-400", description: "Gastos necessários" },
  { value: "lazer", label: "Estilo de Vida", color: "text-purple-400", description: "Desejos e lazer" },
  { value: "investimento", label: "Investimento", color: "text-emerald-400", description: "Poupança e futuro" },
];

export function CategorySelect({ value, group, onChange, className = "" }) {
  const selectedCategory = CATEGORIES.find(c => c.value === value);
  const selectedGroup = GROUPS.find(g => g.value === group);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Category Selection */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 shadow-inner shadow-black/20">
        <label className="block text-sm font-semibold text-gray-200 mb-2">Categoria</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto p-1 custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value, group })}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition duration-200 w-full text-sm font-medium shadow-sm ${
                value === cat.value
                  ? "border-purple-500/70 bg-gradient-to-br from-purple-600/20 to-purple-400/10 text-white shadow-[0_10px_30px_rgba(124,58,237,0.15)]"
                  : "border-slate-700/80 bg-slate-900/40 text-gray-200 hover:border-purple-400/70 hover:bg-slate-800/70"
              }`}
            >
              <cat.icon className={`text-xl ${cat.color}`} />
              <span className="text-xs text-center leading-4">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-700/70 rounded-full" />

      {/* Group Selection */}
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3 shadow-inner shadow-black/20">
        <label className="block text-sm font-semibold text-gray-200 mb-2">
          Classificação do Gasto
        </label>
        <div className="space-y-2">
          {GROUPS.map((grp) => (
            <button
              key={grp.value}
              type="button"
              onClick={() => onChange({ category: value, group: grp.value })}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition duration-200 shadow-sm ${
                group === grp.value
                  ? "border-purple-500/80 bg-gradient-to-r from-purple-600/15 via-purple-500/10 to-blue-500/10 text-white shadow-[0_10px_30px_rgba(124,58,237,0.15)]"
                  : "border-slate-700/80 bg-slate-900/40 text-gray-200 hover:border-purple-400/70 hover:bg-slate-800/70"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${group === grp.value ? 'bg-purple-500' : 'bg-slate-600'}`} />
              <div className="flex-1 text-left">
                <div className={`font-semibold ${grp.color}`}>{grp.label}</div>
                <div className="text-xs text-gray-400">{grp.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selection Summary */}
      {value && group && (
        <div className="p-3 rounded-lg border border-slate-700 bg-slate-900/60 shadow-inner shadow-black/10">
          <div className="flex items-center gap-2 text-sm">
            {selectedCategory && (
              <>
                <selectedCategory.icon className={`text-lg ${selectedCategory.color}`} />
                <span className="font-semibold text-white">{selectedCategory.label}</span>
              </>
            )}
            <span className="text-gray-500">→</span>
            {selectedGroup && (
              <span className={`font-semibold ${selectedGroup.color}`}>{selectedGroup.label}</span>
            )}
          </div>
          {selectedCategory && (
            <div className="text-xs text-gray-400 mt-1">{selectedCategory.description}</div>
          )}
        </div>
      )}
    </div>
  );
}
