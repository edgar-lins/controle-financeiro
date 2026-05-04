import { HiHome, HiShoppingCart, HiLightningBolt, HiHeart, HiAcademicCap, HiSparkles, HiShoppingBag, HiTrendingUp, HiCreditCard } from "react-icons/hi";
import { MdDirectionsBus, MdDirectionsCar, MdCardGiftcard, MdVolunteerActivism } from "react-icons/md";
import type { Expense } from "../types";

export const CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { value: "moradia", label: "Moradia", icon: HiHome, color: "text-primary", description: "Aluguel, condomínio, IPTU" },
  { value: "alimentacao", label: "Alimentação", icon: HiShoppingCart, color: "text-primary", description: "Mercado, feira" },
  { value: "transporte", label: "Transporte", icon: MdDirectionsBus, color: "text-primary", description: "Combustível, transporte público" },
  { value: "contas", label: "Contas", icon: HiLightningBolt, color: "text-primary", description: "Água, luz, internet" },
  { value: "saude", label: "Saúde", icon: HiHeart, color: "text-primary", description: "Plano, remédios, consultas" },
  { value: "educacao", label: "Educação", icon: HiAcademicCap, color: "text-primary", description: "Cursos, livros, escola" },
  { value: "lazer", label: "Lazer", icon: HiSparkles, color: "text-primary", description: "Cinema, shows, hobbies" },
  { value: "restaurantes", label: "Restaurantes", icon: HiShoppingCart, color: "text-primary", description: "Restaurantes, delivery" },
  { value: "streaming", label: "Streaming", icon: HiAcademicCap, color: "text-primary", description: "Netflix, Spotify, etc" },
  { value: "compras", label: "Compras", icon: HiShoppingBag, color: "text-primary", description: "Roupas, eletrônicos" },
  { value: "viagens", label: "Viagens", icon: MdDirectionsCar, color: "text-primary", description: "Férias, passeios" },
  { value: "pets", label: "Pets", icon: HiHeart, color: "text-primary", description: "Veterinário, ração" },
  { value: "presentes", label: "Presentes", icon: MdCardGiftcard, color: "text-primary", description: "Presentes e doações" },
  { value: "doacoes", label: "Doações", icon: MdVolunteerActivism, color: "text-primary", description: "Doações beneficentes" },
  { value: "investimentos", label: "Investimentos", icon: HiTrendingUp, color: "text-primary", description: "Ações, fundos, CDB" },
  { value: "poupanca", label: "Poupança", icon: HiTrendingUp, color: "text-primary", description: "Reserva de emergência" },
  { value: "previdencia", label: "Previdência", icon: HiAcademicCap, color: "text-primary", description: "Aposentadoria" },
  { value: "dividas", label: "Dívidas", icon: HiCreditCard, color: "text-primary", description: "Pagamento de dívidas" },
  { value: "outros", label: "Outros", icon: HiShoppingBag, color: "text-primary", description: "Outros gastos" },
];

const GROUPS: { value: Expense["group"]; label: string; description: string }[] = [
  { value: "essencial", label: "Essenciais", description: "Gastos necessários" },
  { value: "lazer", label: "Estilo de Vida", description: "Desejos e lazer" },
  { value: "investimento", label: "Investimento", description: "Poupança e futuro" },
];

interface CategorySelectProps {
  value: string;
  group: Expense["group"];
  onChange: (selection: { category: string; group: Expense["group"] }) => void;
  className?: string;
}

export function CategorySelect({ value, group, onChange, className = "" }: CategorySelectProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-2">Categoria</label>
        <div className="grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-0.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value, group })}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition duration-150 w-full ${
                value === cat.value
                  ? "border-primary/60 bg-primary/10 text-white"
                  : "border-white/5 bg-white/5 text-secondary hover:border-primary/30 hover:bg-primary/5 hover:text-white"
              }`}
            >
              <cat.icon className="text-base text-primary" />
              <span className="text-[10px] text-center leading-3">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-secondary mb-2">Classificação</label>
        <div className="flex flex-col gap-1.5">
          {GROUPS.map((grp) => (
            <button
              key={grp.value}
              type="button"
              onClick={() => onChange({ category: value, group: grp.value })}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-sm font-semibold transition duration-150 ${
                group === grp.value
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-white/5 bg-white/5 text-secondary hover:border-primary/30 hover:text-white"
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors ${group === grp.value ? 'bg-primary' : 'bg-white/20'}`} />
              {grp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
