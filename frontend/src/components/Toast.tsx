import { useEffect } from "react";
import { Icon } from "./Icon";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const cfg = {
    success: { bg: "#1a2e1e", border: "rgba(127,224,160,0.3)", icon: "check_circle", color: "var(--b-primary)" },
    error:   { bg: "#2e1a1a", border: "rgba(230,138,138,0.3)", icon: "error",       color: "var(--b-rose)" },
    info:    { bg: "#1a1e2e", border: "rgba(143,183,230,0.3)", icon: "info",         color: "var(--b-blue)" },
  }[type] ?? { bg: "#1a2e1e", border: "rgba(127,224,160,0.3)", icon: "check_circle", color: "var(--b-primary)" };

  return (
    <div className="animate-slideDown" style={{
      position: "fixed", top: 16, right: 16, zIndex: 10000,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 16, padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 10,
      minWidth: 260, maxWidth: "90vw",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      backdropFilter: "blur(12px)",
    }}>
      <Icon name={cfg.icon} size={20} color={cfg.color} filled />
      <p style={{ flex: 1, fontSize: 14, color: "var(--b-text)", fontWeight: 500 }}>{message}</p>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--b-muted)", padding: 2 }}>
        <Icon name="close" size={16} color="var(--b-muted)" />
      </button>
    </div>
  );
}
