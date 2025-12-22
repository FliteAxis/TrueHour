// Expenses List Component
// Displays expenses in a table with filtering and budget linking

import { useState, useRef, useEffect } from 'react';
import { useExpenseStore } from '../../store/expenseStore';
import type { Expense, BudgetCard } from '../../types/api';

interface ExpensesListProps {
  expenses: Expense[];
  budgetCards: BudgetCard[];
  onEditExpense: (expense: Expense) => void;
}

type FilterCategory = 'all' | string;

export function ExpensesList({ expenses, budgetCards, onEditExpense }: ExpensesListProps) {
  const { deleteExpense, linkToBudgetCard, unlinkFromBudgetCard } = useExpenseStore();

  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [linkingExpenseId, setLinkingExpenseId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const buttonRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  // Get unique categories from expenses
  const categories = Array.from(new Set(expenses.map((e) => e.category))).sort();

  // Category color mapping - consistent with budget cards
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
      'Flight Training': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
      'Aircraft Rental': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
      'Ground School': { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
      'Books & Materials': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
      'Exams & Checkrides': { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20' },
      'Medical': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
      'Equipment': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
      'Insurance': { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/20' },
      'Membership': { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/20' },
      'Fuel': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
      'Maintenance': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
      'Other': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
    };

    return categoryColors[category] || categoryColors['Other'];
  };

  // Filter expenses
  let filteredExpenses = expenses.filter((expense) => {
    const categoryMatch = filterCategory === 'all' || expense.category === filterCategory;
    return categoryMatch;
  });

  // Sort expenses
  filteredExpenses = [...filteredExpenses].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
      } catch (error) {
        console.error('Failed to delete expense:', error);
        alert('Failed to delete expense. Please try again.');
      }
    }
  };

  const handleLinkToBudget = async (expense: Expense, budgetCardId: number) => {
    try {
      if (budgetCardId === 0) {
        // Unlinking
        if (expense.budget_card_id) {
          await unlinkFromBudgetCard(expense.budget_card_id, expense.id);
        }
      } else {
        await linkToBudgetCard(expense.id, budgetCardId, expense.amount);
      }
      setLinkingExpenseId(null);
    } catch (error) {
      console.error('Failed to link/unlink expense:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to link expense. Please try again.';
      alert(errorMessage);
    }
  };

  const toggleLinkDropdown = (expenseId: number) => {
    if (linkingExpenseId === expenseId) {
      setLinkingExpenseId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[expenseId];
      if (button) {
        const rect = button.getBoundingClientRect();
        // Position dropdown below and to the left of the button
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4, // 4px gap below button
          right: window.innerWidth - rect.right + window.scrollX, // Align right edge with button
        });
      }
      setLinkingExpenseId(expenseId);
    }
  };

  const closeLinkDropdown = () => {
    setLinkingExpenseId(null);
    setDropdownPosition(null);
  };

  // Recalculate position on scroll or resize
  useEffect(() => {
    const handleScroll = () => {
      if (linkingExpenseId !== null) {
        const button = buttonRefs.current[linkingExpenseId];
        if (button) {
          const rect = button.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 4,
            right: window.innerWidth - rect.right + window.scrollX,
          });
        }
      }
    };

    const handleResize = () => {
      if (linkingExpenseId !== null) {
        closeLinkDropdown();
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [linkingExpenseId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleSort = (field: 'date' | 'amount' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <>
      {/* Backdrop for dropdown */}
      {linkingExpenseId !== null && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeLinkDropdown}
        />
      )}

    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">All Expenses</h3>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-truehour-card border border-truehour-border text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-truehour-blue"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-truehour-card border border-truehour-border rounded-lg">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-400">No expenses found</p>
          <p className="text-slate-500 text-sm mt-1">
            {filterCategory !== 'all' ? 'Try adjusting your filters' : 'Add your first expense to get started'}
          </p>
        </div>
      ) : (
        <div className="bg-truehour-card border border-truehour-border rounded-lg overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-truehour-darker border-b border-truehour-border">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortBy === 'date' && (
                        <svg
                          className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => toggleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      {sortBy === 'category' && (
                        <svg
                          className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      {sortBy === 'amount' && (
                        <svg
                          className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-truehour-border">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-truehour-darker transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{formatDate(expense.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const colors = getCategoryColor(expense.category);
                          return (
                            <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded ${colors.bg} ${colors.text} border ${colors.border} w-fit`}>
                              {expense.category}
                            </span>
                          );
                        })()}
                        {expense.subcategory && (
                          <span className="text-xs text-slate-400">{expense.subcategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-300 max-w-md">
                        {expense.description || (
                          <span className="text-slate-500 italic">No description</span>
                        )}
                      </div>
                      {/* Badges */}
                      <div className="flex gap-1.5 mt-1">
                        {expense.is_recurring && (
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Recurring
                          </span>
                        )}
                        {expense.is_tax_deductible && (
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Tax Deductible
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {expense.vendor || <span className="text-slate-500 italic">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-white">{formatCurrency(expense.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Link to Budget Button */}
                        <div className="relative">
                          <button
                            ref={(el) => {
                              buttonRefs.current[expense.id] = el;
                            }}
                            onClick={() => toggleLinkDropdown(expense.id)}
                            className={`p-1.5 transition-colors rounded hover:bg-truehour-darker ${
                              expense.budget_card_id
                                ? 'text-green-400 hover:text-green-300'
                                : 'text-slate-400 hover:text-truehour-blue'
                            }`}
                            aria-label="Link to budget card"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                              />
                            </svg>
                          </button>

                          {/* Dropdown */}
                          {linkingExpenseId === expense.id && dropdownPosition && (
                            <div
                              className="fixed w-64 bg-truehour-card border border-truehour-border rounded-lg shadow-2xl z-50"
                              style={{
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                              }}
                              ref={(el) => {
                                if (el) {
                                  console.log('[ExpensesList] Dropdown rendered with', budgetCards.length, 'budget cards');
                                }
                              }}
                            >
                              <div className="p-2 max-h-64 overflow-y-auto flex flex-col">
                                <div className="text-xs text-slate-400 px-2 py-1 mb-1">Link to Budget Card</div>
                                {budgetCards.length === 0 ? (
                                  <div className="px-2 py-3 text-xs text-slate-500">No budget cards available</div>
                                ) : (
                                  <>
                                    {expense.budget_card_id && (
                                      <button
                                        onClick={() => handleLinkToBudget(expense, 0)}
                                        className="w-full text-left px-2 py-2 text-xs text-red-400 hover:bg-truehour-darker rounded transition-colors"
                                      >
                                        Unlink from Budget
                                      </button>
                                    )}
                                    {budgetCards.map((card, index) => {
                                      console.log(`[ExpensesList] Rendering card ${index + 1}/${budgetCards.length}: ${card.name} (${card.category})`);
                                      return (
                                        <button
                                          key={card.id}
                                          onClick={() => handleLinkToBudget(expense, card.id)}
                                          className={`w-full text-left px-2 py-2 text-xs rounded transition-colors ${
                                            expense.budget_card_id === card.id
                                              ? 'bg-truehour-blue text-white'
                                              : 'text-slate-300 hover:bg-truehour-darker'
                                          }`}
                                        >
                                          <div className="font-medium">{card.name}</div>
                                          <div className="text-xs opacity-75">{card.category}</div>
                                        </button>
                                      );
                                    })}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => onEditExpense(expense)}
                          className="p-1.5 text-slate-400 hover:text-truehour-blue transition-colors rounded hover:bg-truehour-darker"
                          aria-label="Edit expense"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-truehour-darker"
                          aria-label="Delete expense"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="px-6 py-4 bg-truehour-darker border-t border-truehour-border">
            <p className="text-slate-500 text-sm text-center">
              Showing {filteredExpenses.length} of {expenses.length} expense
              {expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
