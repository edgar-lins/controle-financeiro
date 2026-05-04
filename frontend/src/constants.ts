// Métodos de pagamento disponíveis
export const PAYMENT_METHODS = [
  { value: "pix",      label: "Pix",      icon: "bolt" },
  { value: "debito",   label: "Débito",   icon: "credit_card" },
  { value: "credito",  label: "Crédito",  icon: "credit_card" },
  { value: "dinheiro", label: "Dinheiro", icon: "payments" },
  { value: "boleto",   label: "Boleto",   icon: "receipt" },
];

// Grupos de classificação 50/30/20
export const EXPENSE_GROUPS = [
  { value: "essencial",    label: "Essenciais",     description: "Gastos necessários" },
  { value: "lazer",        label: "Estilo de Vida", description: "Desejos e lazer" },
  { value: "investimento", label: "Investimento",   description: "Poupança e futuro" },
];
