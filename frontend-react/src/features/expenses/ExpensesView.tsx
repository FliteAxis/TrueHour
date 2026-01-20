// Expenses View
// Main view for tracking and managing expenses

import { useEffect, useState } from "react";
import { useExpenseStore } from "../../store/expenseStore";
import { useBudgetStore } from "../../store/budgetStore";
import { CreateExpenseModal } from "./CreateExpenseModal";
import { EditExpenseModal } from "./EditExpenseModal";
import { ExpensesList } from "./ExpensesList";
import type { Expense } from "../../types/api";

export function ExpensesView() {
  const { expenses, isLoading, error, fetchExpenses } = useExpenseStore();
  const { cards, loadCards } = useBudgetStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    // Load expenses and budget cards
    const loadData = async () => {
      try {
        await fetchExpenses();
        await loadCards();
      } catch (err) {
        console.error("[ExpensesView] Failed to load data:", err);
      }
    };
    loadData();
  }, [fetchExpenses, loadCards]);

  const handleCreateExpense = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const linkedExpenses = expenses.filter((expense) => expense.budget_card_id != null);
  const unlinkedExpenses = expenses.filter((expense) => expense.budget_card_id == null);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          Error loading expenses: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Expenses</h1>
          <p className="text-slate-400 mt-1">Track your aviation spending and link to budget cards</p>
        </div>
        <button
          onClick={handleCreateExpense}
          className="flex items-center gap-2 px-4 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Expenses */}
        <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium">Total Expenses</h3>
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <svg className="w-5 h-5 text-truehour-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-truehour-blue mb-1">{formatCurrency(totalExpenses)}</div>
          <p className="text-slate-500 text-xs">{expenses.length} total expenses</p>
        </div>

        {/* Linked to Budget */}
        <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium">Linked to Budget</h3>
            <div className="bg-green-500/10 p-2 rounded-lg">
              <svg className="w-5 h-5 text-truehour-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-truehour-green mb-1">{linkedExpenses.length}</div>
          <p className="text-slate-500 text-xs">Expenses linked to cards</p>
        </div>

        {/* Unlinked */}
        <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium">Unlinked</h3>
            <div className="bg-orange-500/10 p-2 rounded-lg">
              <svg className="w-5 h-5 text-truehour-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-truehour-orange mb-1">{unlinkedExpenses.length}</div>
          <p className="text-slate-500 text-xs">Need budget card link</p>
        </div>
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-truehour-blue"></div>
        </div>
      ) : (
        <ExpensesList expenses={expenses} budgetCards={cards} onEditExpense={handleEditExpense} />
      )}

      {/* Modals */}
      <CreateExpenseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} budgetCards={cards} />

      {editingExpense && (
        <EditExpenseModal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          budgetCards={cards}
        />
      )}
    </div>
  );
}
