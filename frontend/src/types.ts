// Modelos de domínio espelhando as structs do backend

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: "corrente" | "poupanca" | "cartao" | "investimento";
  balance: number;
  credit_limit?: number;
  closing_day?: number;
  due_day?: number;
  created_at: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  group: "essencial" | "lazer" | "investimento";
  payment_method: string;
  date: string;
  account_id: number | null;
  account_name?: string;
  installment_number: number;
  installment_total: number;
  installment_group_id?: number | null;
  is_recurring: boolean;
  recurrence_day?: number | null;
}

export interface RecurringPending {
  id: number;
  description: string;
  amount: number;
  category: string;
  group: "essencial" | "lazer" | "investimento";
  payment_method: string;
  account_id: number | null;
  recurrence_day: number | null;
}

export interface Income {
  id: number;
  description: string;
  amount: number;
  date: string;
  month: number;
  year: number;
  account_id: number | null;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at: string;
  completed_at?: string;
  progress: number;
}

export interface Summary {
  mes: string;
  ano: number;
  salario: number;
  renda_extra: number;
  renda_total: number;
  gasto_total: number;
  ideal_fixos: number;
  ideal_lazer: number;
  ideal_invest: number;
  real_fixos: number;
  real_lazer: number;
  real_invest: number;
  saldo_restante: number;
  patrimonio_total: number;
}

export interface MonthlyData {
  month: string;
  month_num: number;
  year: number;
  income: number;
  expenses: number;
  balance: number;
}

export interface GroupBreakdown {
  group: string;
  total: number;
  categories: { category: string; amount: number }[];
}

export interface UserPreferences {
  expenses_percent: number;
  entertainment_percent: number;
  investment_percent: number;
  expected_monthly_income: number;
}

export interface Toast {
  show: boolean;
  message: string;
  type: "success" | "error";
}
