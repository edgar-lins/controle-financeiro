import { useEffect } from "react";
import { HiCheckCircle, HiXCircle, HiInformationCircle } from "react-icons/hi";

export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-emerald-600",
      border: "border-emerald-500",
      icon: <HiCheckCircle className="text-2xl" />,
    },
    error: {
      bg: "bg-red-600",
      border: "border-red-500",
      icon: <HiXCircle className="text-2xl" />,
    },
    info: {
      bg: "bg-cyan-600",
      border: "border-cyan-500",
      icon: <HiInformationCircle className="text-2xl" />,
    },
  };

  const style = styles[type] || styles.success;

  return (
    <div className="fixed top-4 right-4 z-[10000] animate-slideDown">
      <div
        className={`${style.bg} ${style.border} border-l-4 rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[280px] max-w-[95vw] sm:max-w-[400px] backdrop-blur-md`}
      >
        <div className="text-white">{style.icon}</div>
        <p className="text-white font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
