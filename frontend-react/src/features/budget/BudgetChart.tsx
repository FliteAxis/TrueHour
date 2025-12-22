// Budget Chart Component
// Doughnut chart showing spending by category

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { BudgetCategorySummary } from '../../types/api';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface BudgetChartProps {
  summary: BudgetCategorySummary[];
}

// Category color mapping - matches BudgetCardsList.tsx
const CATEGORY_COLORS: Record<string, string> = {
  // Generic budget categories
  'Training': '#3b82f6', // blue
  'Certifications': '#ec4899', // pink
  'Equipment': '#f59e0b', // amber
  'Subscriptions': '#8b5cf6', // purple
  'Membership': '#6366f1', // indigo
  'Administrative': '#14b8a6', // teal
  // Specific expense categories (legacy)
  'Flight Training': '#3b82f6', // blue
  'Aircraft Rental': '#10b981', // green
  'Ground School': '#f59e0b', // orange
  'Books & Materials': '#8b5cf6', // purple
  'Exams & Checkrides': '#ec4899', // pink
  'Medical': '#06b6d4', // cyan
  'Insurance': '#14b8a6', // teal
  'Fuel': '#f97316', // deep orange
  'Maintenance': '#ef4444', // red
  'Other': '#64748b', // slate
};

export function BudgetChart({ summary }: BudgetChartProps) {
  // Filter out categories with no actual spending
  const categoriesWithSpending = summary.filter(
    (cat) => parseFloat(cat.total_actual || '0') > 0
  );

  // Empty state
  if (categoriesWithSpending.length === 0) {
    return (
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Spending by Category</h3>
        <div className="flex flex-col items-center justify-center py-12">
          <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-slate-400 text-center mb-2">
            No expenses linked yet
          </p>
          <div className="text-xs text-slate-500 max-w-md text-center">
            <p>Actual amounts are calculated by linking expenses to budget cards.</p>
            <p className="mt-2">Go to the Expenses page to link your expenses to budget cards.</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const labels = categoriesWithSpending.map((cat) => cat.category);
  const dataValues = categoriesWithSpending.map((cat) =>
    parseFloat(cat.total_actual || '0')
  );
  const colors = categoriesWithSpending.map(
    (cat) => CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['Other']
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Spending',
        data: dataValues,
        backgroundColor: colors,
        borderColor: '#1e293b', // truehour-darker
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#cbd5e1', // slate-300
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
          padding: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: '#1e293b', // truehour-darker
        titleColor: '#ffffff',
        bodyColor: '#cbd5e1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Spending by Category</h3>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <Doughnut data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Legend Summary */}
      <div className="mt-6 pt-6 border-t border-truehour-border">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {categoriesWithSpending.map((cat) => {
            const amount = parseFloat(cat.total_actual || '0');
            const total = categoriesWithSpending.reduce(
              (sum, c) => sum + parseFloat(c.total_actual || '0'),
              0
            );
            const percentage = total > 0 ? (amount / total) * 100 : 0;

            return (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['Other'],
                    }}
                  />
                  <span className="text-slate-400 text-xs">{cat.category}</span>
                </div>
                <span className="text-white font-medium text-xs">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
