import { useEffect, useState } from 'react';
import * as api from '../../services/api';
import type { BudgetCategorySummary } from '../../types/api';

export function BudgetBreakdown() {
  const [categories, setCategories] = useState<BudgetCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      const data = await api.getBudgetCardsSummaryByCategory(new Date().getFullYear());
      setCategories(data);
    } catch (error) {
      console.error('Failed to load budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBudget = categories.reduce((sum, cat) => sum + parseFloat(cat.total_budgeted), 0);

  // Color palette for categories
  const colors = [
    'rgb(59, 130, 246)',  // blue
    'rgb(168, 85, 247)',  // purple
    'rgb(236, 72, 153)',  // pink
    'rgb(251, 146, 60)',  // orange
    'rgb(34, 197, 94)',   // green
    'rgb(20, 184, 166)',  // teal
  ];

  // Calculate percentages and create chart data
  const chartData = categories.map((cat, index) => ({
    ...cat,
    percentage: (parseFloat(cat.total_budgeted) / totalBudget) * 100,
    color: colors[index % colors.length],
  }));

  // Create SVG donut chart
  const donutSize = 200;
  const strokeWidth = 40;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;

  if (isLoading) {
    return (
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Budget Breakdown</h3>
        <div className="flex items-center justify-center h-64 animate-pulse">
          <div className="w-48 h-48 bg-truehour-darker rounded-full"></div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Budget Breakdown</h3>
        <p className="text-slate-400 text-center py-12">
          No budget data available. Add budget cards to see breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Budget Breakdown</h3>

      <div className="flex items-center justify-center mb-6">
        <svg width={donutSize} height={donutSize} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={donutSize / 2}
            cy={donutSize / 2}
            r={radius}
            fill="none"
            stroke="rgb(30, 41, 59)"
            strokeWidth={strokeWidth}
          />

          {/* Colored segments */}
          {chartData.map((item, index) => {
            const segmentLength = (item.percentage / 100) * circumference;
            const segmentOffset = cumulativePercentage * circumference / 100;
            cumulativePercentage += item.percentage;

            return (
              <circle
                key={index}
                cx={donutSize / 2}
                cy={donutSize / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segmentLength} ${circumference}`}
                strokeDashoffset={-segmentOffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-300 text-sm">{item.category}</span>
            </div>
            <div className="text-right">
              <span className="text-white font-semibold text-sm">
                ${parseFloat(item.total_budgeted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-slate-400 text-xs ml-2">
                ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="pt-3 border-t border-truehour-border">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Total</span>
            <span className="text-truehour-blue font-bold text-lg">
              ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
