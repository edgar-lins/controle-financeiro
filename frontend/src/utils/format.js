// Formatar números no padrão brasileiro: 1.234,56
export function formatCurrencyBR(value) {
  if (!value && value !== 0) return "R$ 0,00";
  const numValue = parseFloat(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

// Formatar apenas o número sem símbolo: 1.234,56
export function formatNumberBR(value) {
  if (!value && value !== 0) return "0,00";
  const numValue = parseFloat(value);
  return numValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
