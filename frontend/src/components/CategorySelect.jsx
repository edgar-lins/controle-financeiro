import { HiHome, HiSparkles, HiTrendingUp } from "react-icons/hi";

export function CategorySelect({ value, onChange, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[
        { value: "fixo", label: "Fixo", icon: HiHome, color: "text-blue-400" },
        { value: "lazer", label: "Lazer", icon: HiSparkles, color: "text-purple-400" },
        { value: "investimento", label: "Investimento", icon: HiTrendingUp, color: "text-emerald-400" },
      ].map(({ value: val, label, icon: Icon, color }) => (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition duration-200 ${
            value === val
              ? "border-purple-500 bg-purple-500/20 text-white"
              : "border-slate-600 bg-slate-700/50 text-gray-300 hover:border-purple-400"
          }`}
        >
          <Icon className={`text-lg ${color}`} />
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
