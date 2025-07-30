export interface CategoryGroup {
  id: string;
  name: string;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  budgeted: number;
  groupId: string;
  order?: number;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: "checking" | "savings" | "credit-card";
}

export interface Transaction {
  id: string;
  categoryId: string;
  accountId: string;
  amount: number;
  date: string; // ISO string, auto-detected
  payee: string;
}

export interface Target {
  id: string;
  categoryId: string;
  frequency: "weekly" | "monthly" | "custom";
  targetAmount: number;
  dueDay?: number; // 1-31 for monthly, 1-7 for weekly (1=Monday)
  dueDate?: string; // ISO string for custom
  nextMonthAmount: number;
}
