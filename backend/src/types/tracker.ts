export type TransactionType = "income" | "expense";

export type ExpenseCategory =
  | "crops"
  | "fertilizers"
  | "electricity"
  | "labor"
  | "equipment"
  | "irrigation"
  | "other";

export type IncomeCategory = "crop_sale" | "subsidy" | "other";

export interface Transaction {
  id: string;
  type: TransactionType;
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  description: string;
  date: Date;
  season?: string;
}

export interface TrackerSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  returnOnInvestment: number;
  byCategory: Record<string, number>;
}
