// Budget Cards List Component
// Displays budget cards in a grid layout with tags and card-like appearance

import { useState } from "react";
import { useBudgetStore } from "../../store/budgetStore";
import type { BudgetCard } from "../../types/api";

interface BudgetCardsListProps {
  cards: BudgetCard[];
  onEditCard: (card: BudgetCard) => void;
}

type FilterCategory = "all" | string;
type FilterStatus = "all" | "active" | "inactive" | "completed";

export function BudgetCardsList({ cards, onEditCard }: BudgetCardsListProps) {
  const { deleteCard, duplicateCard } = useBudgetStore();

  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "amount">("date");
  const [cardToDelete, setCardToDelete] = useState<BudgetCard | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(cards.map((c) => c.category))).sort();

  // Filter cards
  let filteredCards = cards.filter((card) => {
    const categoryMatch = filterCategory === "all" || card.category === filterCategory;
    const statusMatch = filterStatus === "all" || card.status === filterStatus;
    return categoryMatch && statusMatch;
  });

  // Sort cards
  filteredCards = [...filteredCards].sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.when_date).getTime() - new Date(a.when_date).getTime();
      case "name":
        return a.name.localeCompare(b.name);
      case "amount":
        return b.budgeted_amount - a.budgeted_amount;
      default:
        return 0;
    }
  });

  const handleDeleteClick = (card: BudgetCard) => {
    setCardToDelete(card);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;

    try {
      await deleteCard(cardToDelete.id);
      setCardToDelete(null);
    } catch (error) {
      console.error("Failed to delete card:", error);
      alert("Failed to delete card. Please try again.");
    }
  };

  const handleDeleteCancel = () => {
    setCardToDelete(null);
  };

  const handleDuplicateCard = async (card: BudgetCard) => {
    try {
      await duplicateCard(card.id);
    } catch (error) {
      console.error("Failed to duplicate card:", error);
      alert("Failed to duplicate card. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Category color mapping - consistent colors for flight training categories
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
      // Generic categories
      Training: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
      Certifications: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
      Equipment: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      Subscriptions: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
      Membership: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
      Administrative: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
      // Specific expense categories (legacy)
      "Flight Training": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
      "Aircraft Rental": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
      "Ground School": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
      "Books & Materials": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      "Exams & Checkrides": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
      Medical: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
      Insurance: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
      Other: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
    };

    return categoryColors[category] || categoryColors["Other"];
  };

  // Generate consistent color for tag based on its name
  const getTagColor = (tag: string) => {
    const colors = [
      { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
      { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
      { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
      { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
      { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
      { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
      { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
      { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/20" },
    ];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Budget Cards</h3>

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

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
            className="bg-truehour-card border border-truehour-border text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-truehour-blue"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="completed">Completed</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-truehour-card border border-truehour-border text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-truehour-blue"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="text-center py-12 bg-truehour-card border border-truehour-border rounded-lg">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-slate-400">No budget cards found</p>
          <p className="text-slate-500 text-sm mt-1">
            {filterCategory !== "all" || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Create your first budget card to get started"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCards.map((card) => {
              const percentUsed = card.budgeted_amount > 0 ? (card.actual_amount / card.budgeted_amount) * 100 : 0;
              const remaining = card.budgeted_amount - card.actual_amount;

              return (
                <div
                  key={card.id}
                  className="bg-truehour-card border border-truehour-border rounded-lg p-4 hover:border-truehour-blue transition-all duration-200 flex flex-col"
                >
                  {/* Header with Edit/Duplicate/Delete */}
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 pr-2">
                      <h4 className="text-white font-semibold text-lg">{card.name}</h4>
                      <p className="text-slate-500 text-xs font-mono">ID: {card.id}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCard(card)}
                        className="p-1.5 text-slate-400 hover:text-truehour-blue transition-colors rounded hover:bg-truehour-darker"
                        aria-label="Edit card"
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
                        onClick={() => handleDuplicateCard(card)}
                        className="p-1.5 text-slate-400 hover:text-truehour-green transition-colors rounded hover:bg-truehour-darker"
                        aria-label="Duplicate card"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(card)}
                        className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded hover:bg-truehour-darker"
                        aria-label="Delete card"
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
                  </div>

                  {/* Tags */}
                  {card.tags && card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {card.tags.map((tag, idx) => {
                        const colors = getTagColor(tag);
                        return (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Category Badge */}
                  <div className="mb-3">
                    {(() => {
                      const colors = getCategoryColor(card.category);
                      return (
                        <span
                          className={`inline-block text-xs px-2.5 py-1 rounded ${colors.bg} ${colors.text} border ${colors.border}`}
                        >
                          {card.category}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Aircraft Info */}
                  {card.aircraft_tail && (
                    <div className="mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3l1.5 3 3.5 1-1 4.5L12 14l3-2.5-1-4.5 3.5-1L19 3M5 21h14"
                        />
                      </svg>
                      <span className="text-sm text-slate-300">
                        {card.aircraft_tail}
                        {card.aircraft_make && card.aircraft_model && (
                          <span className="text-slate-500 ml-1">
                            ({card.aircraft_make} {card.aircraft_model})
                          </span>
                        )}
                      </span>
                      {card.hourly_rate_type && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                          {card.hourly_rate_type}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Associated Hours */}
                  {card.associated_hours && (
                    <div className="mb-3 text-sm text-slate-400">{card.associated_hours} hrs planned</div>
                  )}

                  {/* Budget Info */}
                  <div className="space-y-3 mb-4 flex-1">
                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-slate-400 text-xs">Budgeted:</span>
                        <span className="text-white font-semibold text-lg">{formatCurrency(card.budgeted_amount)}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-slate-400 text-xs">Actual:</span>
                        <span className="text-white font-semibold text-lg">{formatCurrency(card.actual_amount)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-truehour-border">
                      <div className="flex items-baseline justify-between">
                        <span className="text-slate-400 text-xs">Remaining:</span>
                        <span className={`font-bold text-lg ${remaining < 0 ? "text-red-400" : "text-truehour-green"}`}>
                          {formatCurrency(Math.abs(remaining))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>{percentUsed.toFixed(0)}% used</span>
                    </div>
                    <div className="w-full bg-truehour-darker rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          percentUsed > 100
                            ? "bg-red-500"
                            : percentUsed > 80
                              ? "bg-truehour-orange"
                              : "bg-truehour-green"
                        }`}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer with Notes Preview */}
                  {card.notes && (
                    <div className="pt-3 border-t border-truehour-border">
                      <p className="text-slate-400 text-xs line-clamp-2">{card.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Results Count */}
          <div className="text-center pt-4 border-t border-truehour-border">
            <p className="text-slate-500 text-sm">
              Showing {filteredCards.length} of {cards.length} budget card
              {cards.length !== 1 ? "s" : ""}
            </p>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {cardToDelete && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={handleDeleteCancel} />

          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-truehour-card border border-truehour-border rounded-lg shadow-2xl p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">Delete Budget Card</h3>
                  <p className="text-slate-400 text-sm">
                    Are you sure you want to delete "{cardToDelete.name}"? This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Card Info */}
              <div className="bg-truehour-darker rounded-lg p-3 mb-6 border border-truehour-border">
                <div className="text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Budgeted Amount:</span>
                    <span className="text-white font-semibold">{formatCurrency(cardToDelete.budgeted_amount)}</span>
                  </div>
                  {cardToDelete.actual_amount > 0 && (
                    <div className="flex items-center justify-between text-amber-400">
                      <span>Linked Expenses:</span>
                      <span className="font-semibold">{formatCurrency(cardToDelete.actual_amount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              {cardToDelete.actual_amount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
                  <p className="text-amber-400 text-sm flex items-start gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span>This card has linked expenses. They will not be deleted but will become unlinked.</span>
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 bg-truehour-darker hover:bg-truehour-border text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                >
                  Delete Card
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
