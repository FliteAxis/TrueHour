// TrueHour Budget View
// Main budget page with summary cards, chart, and cards list

import { useEffect, useState } from 'react';
import { useBudgetStore } from '../../store/budgetStore';
import { BudgetSummaryCards } from './BudgetSummaryCards';
import { BudgetChart } from './BudgetChart';
import { BudgetCardsList } from './BudgetCardsList';
import { CreateCardModal } from './CreateCardModal';
import { EditCardModal } from './EditCardModal';
import { QuickStartModal } from './QuickStartModal';
import type { BudgetCard } from '../../types/api';

export function BudgetView() {
  const {
    cards,
    summary,
    selectedYear,
    selectedMonth,
    viewMode,
    isLoading,
    error,
    loadCards,
    loadSummary,
    setYear,
    setMonth,
    setViewMode,
  } = useBudgetStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickStartModal, setShowQuickStartModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<BudgetCard | null>(null);

  // Load data on mount and when year changes
  useEffect(() => {
    loadCards(selectedYear);
    loadSummary(selectedYear);
  }, [selectedYear, loadCards, loadSummary]);

  const handleEditCard = (card: BudgetCard) => {
    setSelectedCard(card);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedCard(null);
  };

  const handleYearChange = (year: number) => {
    setYear(year);
  };

  const handleMonthChange = (month: number) => {
    // Handle year rollover
    if (month === 0) {
      setYear(selectedYear - 1);
      setMonth(12);
    } else if (month === 13) {
      setYear(selectedYear + 1);
      setMonth(1);
    } else {
      setMonth(month);
    }
  };

  const handleViewModeChange = (mode: 'annual' | 'monthly') => {
    setViewMode(mode);
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle and Date Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Budget Cards</h1>
          <p className="text-slate-400 mt-1">
            Outcome-based budgeting for your flight training
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-truehour-darker border border-truehour-border rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('annual')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                viewMode === 'annual'
                  ? 'bg-truehour-blue text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
            </button>
            <button
              onClick={() => handleViewModeChange('monthly')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-truehour-blue text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => viewMode === 'annual' ? handleYearChange(selectedYear - 1) : handleMonthChange(selectedMonth - 1)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              aria-label={viewMode === 'annual' ? 'Previous year' : 'Previous month'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {viewMode === 'annual' ? (
              <span className="text-2xl font-bold text-white min-w-[80px] text-center">
                {selectedYear}
              </span>
            ) : (
              <span className="text-2xl font-bold text-white min-w-[120px] text-center">
                {monthNames[selectedMonth - 1]} {selectedYear}
              </span>
            )}

            <button
              onClick={() => viewMode === 'annual' ? handleYearChange(selectedYear + 1) : handleMonthChange(selectedMonth + 1)}
              className="p-2 text-slate-400 hover:text-white transition-colors"
              aria-label={viewMode === 'annual' ? 'Next year' : 'Next month'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => {
                handleYearChange(new Date().getFullYear());
                if (viewMode === 'monthly') {
                  handleMonthChange(new Date().getMonth() + 1);
                }
              }}
              className="ml-2 px-3 py-1.5 text-sm bg-truehour-blue/20 hover:bg-truehour-blue/30 text-truehour-blue border border-truehour-blue/30 rounded-lg transition-colors"
              aria-label="Go to current period"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !cards.length && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-truehour-blue"></div>
          <p className="text-slate-400 mt-4">Loading budget data...</p>
        </div>
      )}

      {/* Content */}
      {!isLoading || cards.length > 0 ? (
        <>
          {/* Summary Cards */}
          <BudgetSummaryCards summary={summary} />

          {/* Chart and Add Button Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart (takes 2 columns) */}
            <div className="lg:col-span-2">
              <BudgetChart summary={summary} />
            </div>

            {/* Quick Actions */}
            <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>

              {/* Quick Start Templates Button */}
              <button
                onClick={() => setShowQuickStartModal(true)}
                className="w-full bg-truehour-blue hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Start Templates
              </button>

              {/* Create Custom Card Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-truehour-card border border-truehour-border hover:border-truehour-blue text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Custom Card
              </button>

              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-truehour-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Total Cards</span>
                  <span className="text-white font-semibold">{cards.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Categories</span>
                  <span className="text-white font-semibold">{summary.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <BudgetCardsList cards={cards} onEditCard={handleEditCard} />
        </>
      ) : null}

      {/* Modals */}
      <CreateCardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <QuickStartModal
        isOpen={showQuickStartModal}
        onClose={() => setShowQuickStartModal(false)}
      />

      {selectedCard && (
        <EditCardModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          card={selectedCard}
        />
      )}
    </div>
  );
}
