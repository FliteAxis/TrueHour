// TrueHour Budget Store
// Manages budget cards state and operations

import { create } from "zustand";
import type { BudgetCard, BudgetCardCreate, BudgetCategorySummary } from "../types/api";
import * as api from "../services/api";

type ViewMode = "annual" | "monthly";

interface BudgetState {
  // State
  cards: BudgetCard[];
  summary: BudgetCategorySummary[];
  selectedYear: number;
  selectedMonth: number; // 1-12
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;

  // Computed
  totalBudgeted: () => number;
  totalActual: () => number;
  remaining: () => number;

  // Actions
  loadCards: (year?: number, month?: number) => Promise<void>;
  loadSummary: (year: number) => Promise<void>;
  createCard: (card: BudgetCardCreate) => Promise<void>;
  updateCard: (id: number, updates: Partial<BudgetCard>) => Promise<void>;
  deleteCard: (id: number) => Promise<void>;
  duplicateCard: (id: number) => Promise<void>;
  setYear: (year: number) => void;
  setMonth: (month: number) => void;
  setViewMode: (mode: ViewMode) => void;
  reset: () => void;
}

export const useBudgetStore = create<BudgetState>()((set, get) => ({
  // Initial state
  cards: [],
  summary: [],
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1, // 1-12
  viewMode: "annual",
  isLoading: false,
  error: null,

  // Computed values
  totalBudgeted: () => {
    const { summary } = get();
    return summary.reduce((sum, cat) => sum + parseFloat(cat.total_budgeted || "0"), 0);
  },

  totalActual: () => {
    const { summary } = get();
    return summary.reduce((sum, cat) => sum + parseFloat(cat.total_actual || "0"), 0);
  },

  remaining: () => {
    const { totalBudgeted, totalActual } = get();
    return totalBudgeted() - totalActual();
  },

  // Load budget cards
  loadCards: async (year?: number, month?: number) => {
    set({ isLoading: true, error: null });
    try {
      const cards = await api.getBudgetCards(year, month);
      set({ cards, isLoading: false });
    } catch (error) {
      console.error("[BudgetStore] Failed to load cards:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load budget cards",
      });
    }
  },

  // Load budget summary (for charts and totals)
  loadSummary: async (year: number) => {
    set({ isLoading: true, error: null });
    try {
      const summary = await api.getBudgetCardsSummaryByCategory(year);
      set({ summary, isLoading: false });
    } catch (error) {
      console.error("[BudgetStore] Failed to load summary:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load budget summary",
      });
    }
  },

  // Create new budget card
  createCard: async (cardData) => {
    set({ isLoading: true, error: null });
    try {
      const newCard = await api.createBudgetCard(cardData);
      set({
        cards: [...get().cards, newCard],
        isLoading: false,
      });
      // Reload summary to update totals
      await get().loadSummary(get().selectedYear);
    } catch (error) {
      console.error("[BudgetStore] Failed to create card:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to create budget card",
      });
      throw error;
    }
  },

  // Update existing budget card
  updateCard: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedCard = await api.updateBudgetCard(id, updates);
      set({
        cards: get().cards.map((c) => (c.id === id ? updatedCard : c)),
        isLoading: false,
      });
      // Reload summary to update totals
      await get().loadSummary(get().selectedYear);
    } catch (error) {
      console.error("[BudgetStore] Failed to update card:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to update budget card",
      });
      throw error;
    }
  },

  // Delete budget card
  deleteCard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteBudgetCard(id);
      set({
        cards: get().cards.filter((c) => c.id !== id),
        isLoading: false,
      });
      // Reload summary to update totals
      await get().loadSummary(get().selectedYear);
    } catch (error) {
      console.error("[BudgetStore] Failed to delete card:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to delete budget card",
      });
      throw error;
    }
  },

  // Duplicate budget card
  duplicateCard: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const duplicatedCard = await api.duplicateBudgetCard(id);
      set({
        cards: [...get().cards, duplicatedCard],
        isLoading: false,
      });
      // Reload summary to update totals
      await get().loadSummary(get().selectedYear);
    } catch (error) {
      console.error("[BudgetStore] Failed to duplicate card:", error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to duplicate budget card",
      });
      throw error;
    }
  },

  // Set selected year
  setYear: (year: number) => {
    set({ selectedYear: year });
    const { viewMode, selectedMonth } = get();
    // Reload cards and summary for new year
    if (viewMode === "monthly") {
      const monthDate = new Date(year, selectedMonth - 1, 1);
      get().loadCards(year, monthDate.getMonth() + 1);
    } else {
      get().loadCards(year);
    }
    get().loadSummary(year);
  },

  // Set selected month
  setMonth: (month: number) => {
    set({ selectedMonth: month });
    const { selectedYear, viewMode } = get();
    // Reload cards for new month
    if (viewMode === "monthly") {
      const monthDate = new Date(selectedYear, month - 1, 1);
      get().loadCards(selectedYear, monthDate.getMonth() + 1);
    }
  },

  // Set view mode
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
    const { selectedYear, selectedMonth } = get();
    // Reload cards based on new view mode
    if (mode === "monthly") {
      const monthDate = new Date(selectedYear, selectedMonth - 1, 1);
      get().loadCards(selectedYear, monthDate.getMonth() + 1);
    } else {
      get().loadCards(selectedYear);
    }
  },

  // Reset store
  reset: () => {
    set({
      cards: [],
      summary: [],
      selectedYear: new Date().getFullYear(),
      selectedMonth: new Date().getMonth() + 1,
      viewMode: "annual",
      isLoading: false,
      error: null,
    });
  },
}));
