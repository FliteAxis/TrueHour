// Edit Budget Card Modal
// Modal form for editing existing budget cards

import { useState, useEffect } from "react";
import { useBudgetStore } from "../../store/budgetStore";
import type { BudgetCard } from "../../types/api";

interface EditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: BudgetCard;
}

const CATEGORIES = [
  "Training",
  "Certifications",
  "Equipment",
  "Subscriptions",
  "Membership",
  "Administrative",
  "Other",
];

const FREQUENCIES = ["once", "monthly", "annual"];
const STATUSES = ["active", "inactive", "completed"];

export function EditCardModal({ isOpen, onClose, card }: EditCardModalProps) {
  const { updateCard } = useBudgetStore();

  const [formData, setFormData] = useState({
    name: card.name,
    category: card.category,
    frequency: card.frequency,
    when_date: card.when_date,
    budgeted_amount: card.budgeted_amount.toString(),
    status: card.status,
    notes: card.notes || "",
  });

  const [tags, setTags] = useState<string[]>(card.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Update form when card changes
  useEffect(() => {
    setFormData({
      name: card.name,
      category: card.category,
      frequency: card.frequency,
      when_date: card.when_date,
      budgeted_amount: card.budgeted_amount.toString(),
      status: card.status,
      notes: card.notes || "",
    });
    setTags(card.tags || []);
  }, [card]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!formData.budgeted_amount || parseFloat(formData.budgeted_amount) <= 0) {
      setError("Budgeted amount must be greater than 0");
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCard(card.id, {
        name: formData.name.trim(),
        category: formData.category,
        frequency: formData.frequency,
        when_date: formData.when_date,
        budgeted_amount: parseFloat(formData.budgeted_amount),
        status: formData.status,
        notes: formData.notes.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update budget card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
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
          <h2 className="text-2xl font-bold text-white">Edit Budget Card</h2>
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
            {/* Name */}
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-slate-300 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                placeholder="e.g., PPL Ground School"
                required
              />
            </div>

            {/* Category and Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-slate-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="edit-category"
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
                <label htmlFor="edit-frequency" className="block text-sm font-medium text-slate-300 mb-2">
                  Frequency <span className="text-red-400">*</span>
                </label>
                <select
                  id="edit-frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                >
                  {FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq}>
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-when_date" className="block text-sm font-medium text-slate-300 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="edit-when_date"
                  value={formData.when_date}
                  onChange={(e) => setFormData({ ...formData, when_date: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-slate-300 mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <select
                  id="edit-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Budgeted Amount */}
            <div>
              <label htmlFor="edit-budgeted_amount" className="block text-sm font-medium text-slate-300 mb-2">
                Budgeted Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  id="edit-budgeted_amount"
                  value={formData.budgeted_amount}
                  onChange={(e) => setFormData({ ...formData, budgeted_amount: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Actual amount: ${Number(card.actual_amount).toFixed(2)} (calculated from linked expenses)
              </p>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="edit-tags" className="block text-sm font-medium text-slate-300 mb-2">
                Tags (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="edit-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  className="flex-1 bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  placeholder="Add a tag (press Enter)"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-truehour-darker border border-truehour-border text-slate-300 hover:text-white hover:border-truehour-blue rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-amber-300 transition-colors"
                        aria-label={`Remove ${tag} tag`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="edit-notes" className="block text-sm font-medium text-slate-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue resize-none"
                rows={3}
                placeholder="Add any additional notes..."
              />
            </div>
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
