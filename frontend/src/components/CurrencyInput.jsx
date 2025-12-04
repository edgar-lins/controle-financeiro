import { useState } from "react";

export function CurrencyInput({ value, onChange, ...props }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");

  const handleFocus = () => {
    setIsEditing(true);
    // Converte o valor para formato editável (com vírgula)
    if (value) {
      const formatted = parseFloat(value).toFixed(2).replace(".", ",");
      setLocalValue(formatted);
    }
  };

  const handleChange = (e) => {
    let input = e.target.value;
    // Permite números, vírgula e ponto
    input = input.replace(/[^\d,]/g, "");
    // Permite apenas uma vírgula
    const parts = input.split(",");
    if (parts.length > 2) {
      input = parts[0] + "," + parts.slice(1).join("");
    }
    setLocalValue(input);
  };

  const handleBlur = (e) => {
    setIsEditing(false);
    const input = e.target.value.replace(",", ".");
    
    if (input === "" || input === ".") {
      onChange("");
      setLocalValue("");
      return;
    }

    const numValue = parseFloat(input);
    if (!isNaN(numValue)) {
      onChange(numValue.toString());
      setLocalValue("");
    } else {
      onChange("");
      setLocalValue("");
    }
  };

  const displayValue = isEditing
    ? localValue
    : value
    ? parseFloat(value).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder="0,00"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
}
