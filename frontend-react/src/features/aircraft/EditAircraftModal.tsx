// Edit Aircraft Modal
// Edit and manage existing aircraft

import { useState } from "react";
import { updateUserAircraft, deleteUserAircraft } from "../../services/api";
import type { UserAircraft, UserAircraftUpdate } from "../../types/api";

interface EditAircraftModalProps {
  aircraft: UserAircraft;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAircraftModal({ aircraft, onClose, onSuccess }: EditAircraftModalProps) {
  const [formData, setFormData] = useState<UserAircraftUpdate>({
    tail_number: aircraft.tail_number,
    make: aircraft.make,
    model: aircraft.model,
    year: aircraft.year,
    type_code: aircraft.type_code,
    gear_type: aircraft.gear_type,
    engine_type: aircraft.engine_type,
    aircraft_class: aircraft.aircraft_class,
    category: aircraft.category,
    is_complex: aircraft.is_complex,
    is_taa: aircraft.is_taa,
    is_high_performance: aircraft.is_high_performance,
    is_simulator: aircraft.is_simulator,
    hourly_rate_wet: aircraft.hourly_rate_wet,
    hourly_rate_dry: aircraft.hourly_rate_dry,
    notes: aircraft.notes,
    is_active: aircraft.is_active,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await updateUserAircraft(aircraft.id, formData);
      onSuccess();
    } catch (err) {
      console.error("Failed to update aircraft:", err);
      setError(err instanceof Error ? err.message : "Failed to update aircraft");
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await deleteUserAircraft(aircraft.id);
      onSuccess();
    } catch (err) {
      console.error("Failed to delete aircraft:", err);
      setError(err instanceof Error ? err.message : "Failed to delete aircraft");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleChange = (field: keyof UserAircraftUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-truehour-darker border border-truehour-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border sticky top-0 bg-truehour-darker z-10">
          <h2 className="text-2xl font-bold text-white">Edit Aircraft</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Aircraft Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tail Number <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.tail_number || ""}
                onChange={(e) => handleChange("tail_number", e.target.value.toUpperCase())}
                placeholder="N172SP"
                className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Make</label>
                <input
                  type="text"
                  value={formData.make || ""}
                  onChange={(e) => handleChange("make", e.target.value || null)}
                  placeholder="Cessna"
                  className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model || ""}
                  onChange={(e) => handleChange("model", e.target.value || null)}
                  placeholder="172"
                  className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year || ""}
                  onChange={(e) => handleChange("year", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="2020"
                  min="1900"
                  max="2100"
                  className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={formData.category || "rental"}
                  onChange={(e) => handleChange("category", e.target.value || null)}
                  className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                >
                  <option value="rental">Rental</option>
                  <option value="club">Club</option>
                  <option value="owned">Owned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gear Type</label>
                <select
                  value={formData.gear_type || ""}
                  onChange={(e) => handleChange("gear_type", e.target.value || null)}
                  className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                >
                  <option value="">Select...</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Retractable">Retractable</option>
                </select>
              </div>
            </div>

            {/* Characteristics */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Characteristics</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_complex || false}
                    onChange={(e) => handleChange("is_complex", e.target.checked)}
                    className="rounded border-truehour-border bg-truehour-card text-truehour-blue focus:ring-truehour-blue focus:ring-offset-0"
                  />
                  <span className="text-sm">Complex</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_taa || false}
                    onChange={(e) => handleChange("is_taa", e.target.checked)}
                    className="rounded border-truehour-border bg-truehour-card text-truehour-blue focus:ring-truehour-blue focus:ring-offset-0"
                  />
                  <span className="text-sm">TAA (Technically Advanced Aircraft)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_high_performance || false}
                    onChange={(e) => handleChange("is_high_performance", e.target.checked)}
                    className="rounded border-truehour-border bg-truehour-card text-truehour-blue focus:ring-truehour-blue focus:ring-offset-0"
                  />
                  <span className="text-sm">High Performance</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_simulator || false}
                    onChange={(e) => handleChange("is_simulator", e.target.checked)}
                    className="rounded border-truehour-border bg-truehour-card text-truehour-blue focus:ring-truehour-blue focus:ring-offset-0"
                  />
                  <span className="text-sm">Simulator</span>
                </label>
              </div>
            </div>

            {/* Rates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hourly Rate (Wet)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.hourly_rate_wet || ""}
                    onChange={(e) =>
                      handleChange("hourly_rate_wet", e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Hourly Rate (Dry)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={formData.hourly_rate_dry || ""}
                    onChange={(e) =>
                      handleChange("hourly_rate_dry", e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value || null)}
                placeholder="Additional notes about this aircraft..."
                rows={3}
                className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue resize-none"
              />
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active !== false}
                  onChange={(e) => handleChange("is_active", e.target.checked)}
                  className="rounded border-truehour-border bg-truehour-card text-truehour-blue focus:ring-truehour-blue focus:ring-offset-0"
                />
                <span className="text-sm font-medium">Active Aircraft</span>
              </label>
              <p className="text-xs text-slate-400 mt-1 ml-6">
                Inactive aircraft won't appear in dropdown menus but remain in your records
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-truehour-border">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-900/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-900/30 transition-colors"
            >
              Delete
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-truehour-card text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.tail_number?.trim()}
              className="px-4 py-2 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-truehour-darker border border-red-500/50 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Delete Aircraft?</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{aircraft.tail_number}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-truehour-card text-slate-300 rounded-lg hover:bg-truehour-border transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
