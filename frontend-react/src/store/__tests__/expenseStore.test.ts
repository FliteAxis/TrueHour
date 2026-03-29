/**
 * Unit tests for useExpenseStore.
 * Mocks fetch() so no real network calls are made.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useExpenseStore } from "../expenseStore";

const mockExpense = {
  id: 1,
  aircraft_id: null,
  category: "fuel",
  description: "Avgas at KPWK",
  amount: "85.50",
  date: "2025-01-15",
  is_recurring: false,
  vendor: "Shell",
  is_tax_deductible: false,
};

const makeOkResponse = (body: unknown) =>
  ({
    ok: true,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(""),
  }) as Response;

const makeErrorResponse = (status: number, text: string) =>
  ({
    ok: false,
    status,
    text: () => Promise.resolve(text),
  }) as Response;

beforeEach(() => {
  vi.restoreAllMocks();
  useExpenseStore.getState().reset();
});

describe("useExpenseStore - initial state", () => {
  it("starts with empty arrays and no error", () => {
    const state = useExpenseStore.getState();
    expect(state.expenses).toEqual([]);
    expect(state.summary).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe("useExpenseStore - fetchExpenses", () => {
  it("sets expenses on successful fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeOkResponse([mockExpense]));

    await act(async () => {
      await useExpenseStore.getState().fetchExpenses();
    });

    expect(useExpenseStore.getState().expenses).toEqual([mockExpense]);
    expect(useExpenseStore.getState().isLoading).toBe(false);
  });

  it("sets error and throws on failed fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeErrorResponse(500, "Server error"));

    await expect(
      act(async () => {
        await useExpenseStore.getState().fetchExpenses();
      })
    ).rejects.toThrow();

    expect(useExpenseStore.getState().error).toMatch(/500/);
  });

  it("builds query string for filters", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(makeOkResponse([]));

    await act(async () => {
      await useExpenseStore.getState().fetchExpenses({ category: "fuel", aircraft_id: 1 });
    });

    const calledUrl = spy.mock.calls[0][0] as string;
    expect(calledUrl).toContain("category=fuel");
    expect(calledUrl).toContain("aircraft_id=1");
  });
});

describe("useExpenseStore - createExpense", () => {
  it("prepends new expense to list", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeOkResponse(mockExpense));

    useExpenseStore.setState({ expenses: [] });

    let result: unknown;
    await act(async () => {
      result = await useExpenseStore.getState().createExpense({
        category: "fuel",
        amount: "85.50",
        date: "2025-01-15",
      } as any);
    });

    expect(result).toEqual(mockExpense);
    expect(useExpenseStore.getState().expenses[0]).toEqual(mockExpense);
  });
});

describe("useExpenseStore - updateExpense", () => {
  it("replaces updated expense in list", async () => {
    const updated = { ...mockExpense, description: "Updated" };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(makeOkResponse(updated));

    useExpenseStore.setState({ expenses: [mockExpense as any] });

    await act(async () => {
      await useExpenseStore.getState().updateExpense(1, { description: "Updated" } as any);
    });

    expect(useExpenseStore.getState().expenses[0].description).toBe("Updated");
  });
});

describe("useExpenseStore - deleteExpense", () => {
  it("removes expense from list on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

    useExpenseStore.setState({ expenses: [mockExpense as any] });

    await act(async () => {
      await useExpenseStore.getState().deleteExpense(1);
    });

    expect(useExpenseStore.getState().expenses).toHaveLength(0);
  });

  it("sets error and throws on failed delete", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(
      act(async () => {
        await useExpenseStore.getState().deleteExpense(999);
      })
    ).rejects.toThrow();
  });
});

describe("useExpenseStore - reset", () => {
  it("clears all state", () => {
    useExpenseStore.setState({
      expenses: [mockExpense as any],
      error: "some error",
      isLoading: true,
    });

    useExpenseStore.getState().reset();

    expect(useExpenseStore.getState().expenses).toEqual([]);
    expect(useExpenseStore.getState().error).toBeNull();
    expect(useExpenseStore.getState().isLoading).toBe(false);
  });
});
