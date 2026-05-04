import { useState, type InputHTMLAttributes } from "react";

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: string | number;
  onChange: (value: string) => void;
}

export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState("");

  const handleFocus = () => {
    setIsEditing(true);
    if (value) {
      const formatted = parseFloat(String(value)).toFixed(2).replace(".", ",");
      setLocalValue(formatted);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    input = input.replace(/[^\d,]/g, "");
    const parts = input.split(",");
    if (parts.length > 2) {
      input = parts[0] + "," + parts.slice(1).join("");
    }
    setLocalValue(input);

    const normalized = input.replace(",", ".");
    const numValue = parseFloat(normalized);
    if (!isNaN(numValue)) {
      onChange(numValue.toString());
    } else if (input === "") {
      onChange("");
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
    ? parseFloat(String(value)).toLocaleString("pt-BR", {
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
