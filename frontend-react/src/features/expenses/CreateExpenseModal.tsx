// Create Expense Modal
// Modal form for creating new expenses

import { useState } from "react";
import { useExpenseStore } from "../../store/expenseStore";
import type { BudgetCard } from "../../types/api";

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetCards?: BudgetCard[];
}

const CATEGORIES = [
  "Flight Training",
  "Aircraft Rental",
  "Ground School",
  "Books & Materials",
  "Exams & Checkrides",
  "Medical",
  "Equipment",
  "Insurance",
  "Membership",
  "Fuel",
  "Maintenance",
  "Other",
];

export function CreateExpenseModal({ isOpen, onClose, budgetCards = [] }: CreateExpenseModalProps) {
  const { createExpense, linkToBudgetCard } = useExpenseStore();

  const [formData, setFormData] = useState({
    category: "Flight Training",
    subcategory: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    budget_card_id: "",
    is_recurring: false,
    recurrence_interval: "",
    recurrence_end_date: "",
    is_tax_deductible: false,
    tax_category: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      const newExpense = await createExpense({
        category: formData.category,
        subcategory: formData.subcategory || null,
        description: formData.description || null,
        amount: parseFloat(formData.amount),
        date: formData.date,
        is_recurring: formData.is_recurring,
        recurrence_interval:
          formData.is_recurring && formData.recurrence_interval ? formData.recurrence_interval : null,
        recurrence_end_date:
          formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : null,
        vendor: formData.vendor || null,
        is_tax_deductible: formData.is_tax_deductible,
        tax_category: formData.is_tax_deductible && formData.tax_category ? formData.tax_category : null,
      });

      // Link to budget card if selected
      if (formData.budget_card_id && newExpense) {
        await linkToBudgetCard(newExpense.id, parseInt(formData.budget_card_id), newExpense.amount);
      }

      // Reset form and close
      setFormData({
        category: "Flight Training",
        subcategory: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        budget_card_id: "",
        is_recurring: false,
        recurrence_interval: "",
        recurrence_end_date: "",
        is_tax_deductible: false,
        tax_category: "",
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        category: "Flight Training",
        subcategory: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        budget_card_id: "",
        is_recurring: false,
        recurrence_interval: "",
        recurrence_end_date: "",
        is_tax_deductible: false,
        tax_category: "",
      });
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-truehour-card border border-truehour-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border">
          <h2 className="text-2xl font-bold text-white">Add Expense</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Category and Subcategory */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-slate-300 mb-2">
                  Subcategory (Optional)
                </label>
                <input
                  type="text"
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  placeholder="e.g., Dual instruction"
                />
              </div>
            </div>

            {/* Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                  Amount <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  required
                />
              </div>
            </div>

            {/* Vendor */}
            <div>
              <label htmlFor="vendor" className="block text-sm font-medium text-slate-300 mb-2">
                Vendor (Optional)
              </label>
              <input
                type="text"
                id="vendor"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                placeholder="e.g., Local Aviation School"
              />
            </div>

            {/* Budget Card Link */}
            {budgetCards.length > 0 && (
              <div>
                <label htmlFor="budget_card_id" className="block text-sm font-medium text-slate-300 mb-2">
                  Link to Budget Card (Optional)
                </label>
                <select
                  id="budget_card_id"
                  value={formData.budget_card_id}
                  onChange={(e) => setFormData({ ...formData, budget_card_id: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                >
                  <option value="">None - Don't link to budget</option>
                  {budgetCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} - {card.category}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Link this expense to a budget card to track spending against your budget
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue resize-none"
                rows={3}
                placeholder="Add any additional details..."
              />
            </div>

            {/* Recurring Expense */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="mt-1 w-4 h-4 text-truehour-blue bg-truehour-darker border-truehour-border rounded focus:ring-truehour-blue"
              />
              <div className="flex-1">
                <label htmlFor="is_recurring" className="text-sm font-medium text-slate-300">
                  Recurring Expense
                </label>
                <p className="text-xs text-slate-500 mt-0.5">This expense repeats on a regular schedule</p>
              </div>
            </div>

            {/* Recurring Options */}
            {formData.is_recurring && (
              <div className="grid grid-cols-2 gap-4 pl-7">
                <div>
                  <label htmlFor="recurrence_interval" className="block text-sm font-medium text-slate-300 mb-2">
                    Frequency
                  </label>
                  <select
                    id="recurrence_interval"
                    value={formData.recurrence_interval}
                    onChange={(e) => setFormData({ ...formData, recurrence_interval: e.target.value })}
                    className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  >
                    <option value="">Select...</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="recurrence_end_date" className="block text-sm font-medium text-slate-300 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="recurrence_end_date"
                    value={formData.recurrence_end_date}
                    onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                    className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  />
                </div>
              </div>
            )}

            {/* Tax Deductible */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="is_tax_deductible"
                checked={formData.is_tax_deductible}
                onChange={(e) => setFormData({ ...formData, is_tax_deductible: e.target.checked })}
                className="mt-1 w-4 h-4 text-truehour-blue bg-truehour-darker border-truehour-border rounded focus:ring-truehour-blue"
              />
              <div className="flex-1">
                <label htmlFor="is_tax_deductible" className="text-sm font-medium text-slate-300">
                  Tax Deductible
                </label>
                <p className="text-xs text-slate-500 mt-0.5">Mark if this expense may be tax deductible</p>
              </div>
            </div>

            {/* Tax Category */}
            {formData.is_tax_deductible && (
              <div className="pl-7">
                <label htmlFor="tax_category" className="block text-sm font-medium text-slate-300 mb-2">
                  Tax Category (Optional)
                </label>
                <input
                  type="text"
                  id="tax_category"
                  value={formData.tax_category}
                  onChange={(e) => setFormData({ ...formData, tax_category: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  placeholder="e.g., Education, Business expense"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-truehour-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
