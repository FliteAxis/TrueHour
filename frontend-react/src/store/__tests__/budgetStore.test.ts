/**
 * Unit tests for useBudgetStore.
 * API calls are mocked so no network or backend is required.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";

// Mock the api module before importing the store
vi.mock("../../services/api", () => ({
  getBudgetCards: vi.fn(),
  getBudgetCardsSummaryByCategory: vi.fn(),
  createBudgetCard: vi.fn(),
  updateBudgetCard: vi.fn(),
  deleteBudgetCard: vi.fn(),
  duplicateBudgetCard: vi.fn(),
}));

import { useBudgetStore } from "../budgetStore";
import * as api from "../../services/api";

const mockCards = [
  {
    id: 1,
    name: "Flight Training",
    category: "training",
    frequency: "monthly",
    budgeted_amount: "500.00",
    actual_amount: "350.00",
    status: "active",
  },
  {
    id: 2,
    name: "Insurance",
    category: "insurance",
    frequency: "annual",
    budgeted_amount: "1200.00",
    actual_amount: "1200.00",
    status: "active",
  },
];

const mockSummary = [
  { category: "training", total_budgeted: "500.00", total_actual: "350.00", card_count: 1 },
  { category: "insurance", total_budgeted: "1200.00", total_actual: "1200.00", card_count: 1 },
];

beforeEach(() => {
  vi.clearAllMocks();
  useBudgetStore.getState().reset();
});

describe("useBudgetStore - initial state", () => {
  it("initialises with empty cards and summary", () => {
    const state = useBudgetStore.getState();
    expect(state.cards).toEqual([]);
    expect(state.summary).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("initialises viewMode as annual", () => {
    expect(useBudgetStore.getState().viewMode).toBe("annual");
  });

  it("initialises selectedYear to current year", () => {
    expect(useBudgetStore.getState().selectedYear).toBe(new Date().getFullYear());
  });
});

describe("useBudgetStore - computed values", () => {
  it("totalBudgeted sums summary budgeted amounts", () => {
    useBudgetStore.setState({ summary: mockSummary });
    expect(useBudgetStore.getState().totalBudgeted()).toBe(1700);
  });

  it("totalActual sums summary actual amounts", () => {
    useBudgetStore.setState({ summary: mockSummary });
    expect(useBudgetStore.getState().totalActual()).toBe(1550);
  });

  it("remaining = totalBudgeted - totalActual", () => {
    useBudgetStore.setState({ summary: mockSummary });
    expect(useBudgetStore.getState().remaining()).toBe(150);
  });

  it("totalBudgeted returns 0 for empty summary", () => {
    expect(useBudgetStore.getState().totalBudgeted()).toBe(0);
  });

  it("remaining returns 0 for empty summary", () => {
    expect(useBudgetStore.getState().remaining()).toBe(0);
  });
});

describe("useBudgetStore - loadCards", () => {
  it("sets cards on success", async () => {
    vi.mocked(api.getBudgetCards).mockResolvedValue(mockCards as any);

    await act(async () => {
      await useBudgetStore.getState().loadCards();
    });

    expect(useBudgetStore.getState().cards).toEqual(mockCards);
    expect(useBudgetStore.getState().isLoading).toBe(false);
    expect(useBudgetStore.getState().error).toBeNull();
  });

  it("sets error on failure", async () => {
    vi.mocked(api.getBudgetCards).mockRejectedValue(new Error("Network error"));

    await act(async () => {
      await useBudgetStore.getState().loadCards();
    });

    expect(useBudgetStore.getState().isLoading).toBe(false);
    expect(useBudgetStore.getState().error).toBe("Network error");
  });
});

describe("useBudgetStore - loadSummary", () => {
  it("sets summary on success", async () => {
    vi.mocked(api.getBudgetCardsSummaryByCategory).mockResolvedValue(mockSummary as any);

    await act(async () => {
      await useBudgetStore.getState().loadSummary(2025);
    });

    expect(useBudgetStore.getState().summary).toEqual(mockSummary);
  });
});

describe("useBudgetStore - createCard", () => {
  it("appends new card to list", async () => {
    const newCard = { ...mockCards[0], id: 3, name: "New Card" };
    vi.mocked(api.createBudgetCard).mockResolvedValue(newCard as any);
    vi.mocked(api.getBudgetCardsSummaryByCategory).mockResolvedValue([]);

    useBudgetStore.setState({ cards: mockCards as any });

    await act(async () => {
      await useBudgetStore.getState().createCard({ name: "New Card" } as any);
    });

    expect(useBudgetStore.getState().cards).toHaveLength(3);
    expect(useBudgetStore.getState().cards[2].id).toBe(3);
  });
});

describe("useBudgetStore - updateCard", () => {
  it("replaces the updated card in list", async () => {
    const updated = { ...mockCards[0], name: "Updated Name" };
    vi.mocked(api.updateBudgetCard).mockResolvedValue(updated as any);
    vi.mocked(api.getBudgetCardsSummaryByCategory).mockResolvedValue([]);

    useBudgetStore.setState({ cards: mockCards as any });

    await act(async () => {
      await useBudgetStore.getState().updateCard(1, { name: "Updated Name" } as any);
    });

    const card = useBudgetStore.getState().cards.find((c) => c.id === 1);
    expect(card?.name).toBe("Updated Name");
  });
});

describe("useBudgetStore - deleteCard", () => {
  it("removes card from list", async () => {
    vi.mocked(api.deleteBudgetCard).mockResolvedValue(undefined);
    vi.mocked(api.getBudgetCardsSummaryByCategory).mockResolvedValue([]);

    useBudgetStore.setState({ cards: mockCards as any });

    await act(async () => {
      await useBudgetStore.getState().deleteCard(1);
    });

    expect(useBudgetStore.getState().cards).toHaveLength(1);
    expect(useBudgetStore.getState().cards[0].id).toBe(2);
  });
});

describe("useBudgetStore - setYear / setMonth / setViewMode", () => {
  it("setYear updates selectedYear", () => {
    vi.mocked(api.getBudgetCards).mockResolvedValue([]);
    vi.mocked(api.getBudgetCardsSummaryByCategory).mockResolvedValue([]);

    useBudgetStore.getState().setYear(2024);
    expect(useBudgetStore.getState().selectedYear).toBe(2024);
  });

  it("setMonth updates selectedMonth", () => {
    vi.mocked(api.getBudgetCards).mockResolvedValue([]);
    useBudgetStore.getState().setMonth(6);
    expect(useBudgetStore.getState().selectedMonth).toBe(6);
  });

  it("setViewMode updates viewMode", () => {
    vi.mocked(api.getBudgetCards).mockResolvedValue([]);
    useBudgetStore.getState().setViewMode("monthly");
    expect(useBudgetStore.getState().viewMode).toBe("monthly");
  });
});

describe("useBudgetStore - reset", () => {
  it("resets all state to defaults", () => {
    useBudgetStore.setState({
      cards: mockCards as any,
      summary: mockSummary,
      error: "some error",
      isLoading: true,
    });

    useBudgetStore.getState().reset();

    const state = useBudgetStore.getState();
    expect(state.cards).toEqual([]);
    expect(state.summary).toEqual([]);
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });
});
