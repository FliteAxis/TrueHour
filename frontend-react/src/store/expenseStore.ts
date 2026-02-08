// Expense Store
// Zustand store for managing expenses

import { create } from "zustand";
import type { Expense, ExpenseCreate, ExpenseUpdate, ExpenseSummary } from "../types/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

// Helper for handling API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  return response.json();
}

interface ExpenseState {
  expenses: Expense[];
  summary: ExpenseSummary[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchExpenses: (filters?: {
    aircraft_id?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
  }) => Promise<void>;
  fetchSummary: (filters?: { start_date?: string; end_date?: string; group_by?: string }) => Promise<void>;
  createExpense: (expense: ExpenseCreate) => Promise<Expense>;
  updateExpense: (id: number, expense: ExpenseUpdate) => Promise<Expense>;
  deleteExpense: (id: number) => Promise<void>;
  linkToBudgetCard: (expenseId: number, budgetCardId: number, amount: number, skipRefresh?: boolean) => Promise<void>;
  unlinkFromBudgetCard: (budgetCardId: number, expenseId: number, skipRefresh?: boolean) => Promise<void>;
  reset: () => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  summary: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters?.aircraft_id) params.append("aircraft_id", filters.aircraft_id.toString());
      if (filters?.category) params.append("category", filters.category);
      if (filters?.start_date) params.append("start_date", filters.start_date);
      if (filters?.end_date) params.append("end_date", filters.end_date);

      const queryString = params.toString();
      const url = `${API_BASE}/api/user/expenses${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      const expenses = await handleResponse<Expense[]>(response);

      set({ expenses, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch expenses",
        isLoading: false,
      });
      throw error;
    }
  },

  fetchSummary: async (filters) => {
    try {
      const params = new URLSearchParams();
      if (filters?.start_date) params.append("start_date", filters.start_date);
      if (filters?.end_date) params.append("end_date", filters.end_date);
      if (filters?.group_by) params.append("group_by", filters.group_by);

      const queryString = params.toString();
      const url = `${API_BASE}/api/user/expenses/summary${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(url);
      const summary = await handleResponse<ExpenseSummary[]>(response);

      set({ summary });
    } catch (error) {
      console.error("Failed to fetch expense summary:", error);
      throw error;
    }
  },

  createExpense: async (expense) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/user/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      const created = await handleResponse<Expense>(response);
      set((state) => ({
        expenses: [created, ...state.expenses],
        isLoading: false,
      }));
      return created;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to create expense",
        isLoading: false,
      });
      throw error;
    }
  },

  updateExpense: async (id, expense) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/user/expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expense),
      });
      const updated = await handleResponse<Expense>(response);
      set((state) => ({
        expenses: state.expenses.map((e) => (e.id === id ? updated : e)),
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update expense",
        isLoading: false,
      });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/user/expenses/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete expense: ${response.status}`);
      }
      set((state) => ({
        expenses: state.expenses.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete expense",
        isLoading: false,
      });
      throw error;
    }
  },

  linkToBudgetCard: async (expenseId, budgetCardId, amount, skipRefresh = false) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/user/budget-cards/${budgetCardId}/link-expense?expense_id=${expenseId}&amount=${amount}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      await handleResponse<void>(response);
      // Refresh expenses to get updated link status (unless skipped)
      if (!skipRefresh) {
        await get().fetchExpenses();
      }
    } catch (error) {
      console.error("Failed to link expense to budget card:", error);
      throw error;
    }
  },

  unlinkFromBudgetCard: async (budgetCardId, expenseId, skipRefresh = false) => {
    try {
      const response = await fetch(`${API_BASE}/api/user/budget-cards/${budgetCardId}/unlink-expense/${expenseId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to unlink expense: ${response.status}`);
      }
      // Refresh expenses to get updated link status (unless skipped)
      if (!skipRefresh) {
        await get().fetchExpenses();
      }
    } catch (error) {
      console.error("Failed to unlink expense from budget card:", error);
      throw error;
    }
  },

  reset: () => {
    set({
      expenses: [],
      summary: [],
      isLoading: false,
      error: null,
    });
  },
}));
