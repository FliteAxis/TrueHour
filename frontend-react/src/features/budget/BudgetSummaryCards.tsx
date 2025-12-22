// Budget Summary Cards Component
// Displays 3 summary cards: Total Budgeted, Total Actual, Remaining

import type { BudgetCategorySummary } from '../../types/api';

interface BudgetSummaryCardsProps {
  summary: BudgetCategorySummary[];
}

export function BudgetSummaryCards({ summary }: BudgetSummaryCardsProps) {
  // Calculate totals from summary
  const totalBudgeted = summary.reduce(
    (sum, cat) => sum + parseFloat(cat.total_budgeted || '0'),
    0
  );

  const totalActual = summary.reduce(
    (sum, cat) => sum + parseFloat(cat.total_actual || '0'),
    0
  );

  const remaining = totalBudgeted - totalActual;
  const percentUsed = totalBudgeted > 0 ? (totalActual / totalBudgeted) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Budgeted Card */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6 hover:border-truehour-blue transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-sm font-medium">Total Budgeted</h3>
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <svg className="w-5 h-5 text-truehour-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <div className="text-3xl font-bold text-truehour-blue mb-1">
          {formatCurrency(totalBudgeted)}
        </div>
        <p className="text-slate-500 text-xs">
          Allocated for training
        </p>
      </div>

      {/* Total Actual Card */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6 hover:border-truehour-green transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-sm font-medium">Total Actual</h3>
          <div className={`${totalActual > totalBudgeted ? 'bg-red-500/10' : 'bg-green-500/10'} p-2 rounded-lg`}>
            <svg className={`w-5 h-5 ${totalActual > totalBudgeted ? 'text-red-400' : 'text-truehour-green'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className={`text-3xl font-bold mb-1 ${totalActual > totalBudgeted ? 'text-red-400' : 'text-truehour-green'}`}>
          {formatCurrency(totalActual)}
        </div>
        <p className="text-slate-500 text-xs">
          {percentUsed.toFixed(1)}% of budget used
        </p>
      </div>

      {/* Remaining Card */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6 hover:border-truehour-orange transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-slate-400 text-sm font-medium">Remaining</h3>
          <div className={`${remaining < 0 ? 'bg-red-500/10' : 'bg-orange-500/10'} p-2 rounded-lg`}>
            <svg className={`w-5 h-5 ${remaining < 0 ? 'text-red-400' : 'text-truehour-orange'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
        <div className={`text-3xl font-bold mb-1 ${remaining < 0 ? 'text-red-400' : 'text-truehour-orange'}`}>
          {formatCurrency(Math.abs(remaining))}
        </div>
        <p className="text-slate-500 text-xs">
          {remaining < 0 ? 'Over budget' : 'Available to spend'}
        </p>
      </div>
    </div>
  );
}
