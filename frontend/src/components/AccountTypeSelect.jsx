import { FaMoneyBill, FaPiggyBank, FaCreditCard, FaChartLine } from "react-icons/fa";

export function AccountTypeSelect({ value, onChange }) {
  const accountTypes = [
    { value: "corrente", label: "Conta Corrente", icon: FaMoneyBill, color: "text-blue-400" },
    { value: "poupanca", label: "Poupança", icon: FaPiggyBank, color: "text-emerald-400" },
    { value: "cartao", label: "Cartão de Crédito", icon: FaCreditCard, color: "text-purple-400" },
    { value: "investimento", label: "Investimentos", icon: FaChartLine, color: "text-cyan-400" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {accountTypes.map(({ value: val, label, icon: Icon, color }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition duration-200 ${
            value === val
              ? "border-cyan-500 bg-cyan-500/20 text-white"
              : "border-slate-600 bg-slate-700/50 text-gray-300 hover:border-cyan-400"
          }`}
        >
          <Icon className={`text-2xl ${color}`} />
          <span className="text-xs font-medium text-center">{label}</span>
        </button>
      ))}
    </div>
  );
}
