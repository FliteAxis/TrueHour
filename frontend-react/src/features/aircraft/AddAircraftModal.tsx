// Add Aircraft Modal with FAA Lookup
// Allows users to add aircraft with automatic FAA data lookup

import { useState } from "react";
import { createUserAircraft, lookupFAAAircraft } from "../../services/api";
import type { UserAircraftCreate } from "../../types/api";

interface AddAircraftModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAircraftModal({ onClose, onSuccess }: AddAircraftModalProps) {
  const [formData, setFormData] = useState<UserAircraftCreate>({
    tail_number: "",
    make: "",
    model: "",
    year: undefined,
    category: "rental",
    is_complex: false,
    is_taa: false,
    is_high_performance: false,
    is_simulator: false,
    is_active: true,
    data_source: "manual",
  });

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!formData.tail_number.trim()) {
      setLookupError("Please enter a tail number");
      return;
    }

    setIsLookingUp(true);
    setLookupError(null);

    try {
      const data = await lookupFAAAircraft(formData.tail_number);

      // Populate form with FAA data including inferred gear type
      setFormData((prev) => ({
        ...prev,
        make: data.manufacturer || prev.make,
        model: data.model || prev.model,
        year: data.year_mfr ? parseInt(data.year_mfr) : prev.year,
        type_code: data.series || prev.type_code,
        engine_type: data.engine_type || prev.engine_type,
        gear_type: data.gear_type || prev.gear_type,
        is_complex: data.is_complex ?? prev.is_complex,
        is_high_performance: data.is_high_performance ?? prev.is_high_performance,
        data_source: "faa",
        faa_last_checked: new Date().toISOString(),
      }));
    } catch (err) {
      console.error("FAA lookup failed:", err);
      setLookupError("Aircraft not found in FAA registry. You can still add it manually.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await createUserAircraft(formData);
      onSuccess();
    } catch (err) {
      console.error("Failed to create aircraft:", err);
      setError(err instanceof Error ? err.message : "Failed to create aircraft");
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof UserAircraftCreate, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-truehour-darker border border-truehour-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border sticky top-0 bg-truehour-darker z-10">
          <h2 className="text-2xl font-bold text-white">Add Aircraft</h2>
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

          {/* FAA Lookup Section */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">FAA Registry Lookup</h3>
            <p className="text-slate-400 text-sm mb-4">
              Enter a U.S. tail number (N-number) to automatically populate aircraft details from the FAA registry.
            </p>

            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={formData.tail_number}
                  onChange={(e) => handleChange("tail_number", e.target.value.toUpperCase())}
                  placeholder="N172SP"
                  className="w-full px-3 py-2 bg-truehour-darker border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleLookup}
                disabled={isLookingUp || !formData.tail_number.trim()}
                className="px-4 py-2 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isLookingUp ? "Looking up..." : "Lookup FAA"}
              </button>
            </div>

            {lookupError && (
              <div className="mt-2 text-amber-400 text-sm flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{lookupError}</span>
              </div>
            )}
          </div>

          {/* Aircraft Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Aircraft Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Make</label>
                <input
                  type="text"
                  value={formData.make || ""}
                  onChange={(e) => handleChange("make", e.target.value)}
                  placeholder="Cessna"
                  className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
                <input
                  type="text"
                  value={formData.model || ""}
                  onChange={(e) => handleChange("model", e.target.value)}
                  placeholder="172"
                  className="w-full px-3 py-2 bg-truehour-card border border-truehour-border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-truehour-blue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                <input
                  type="number"
                  value={formData.year || ""}
                  onChange={(e) => handleChange("year", e.target.value ? parseInt(e.target.value) : undefined)}
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
                  onChange={(e) => handleChange("category", e.target.value)}
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
                      handleChange("hourly_rate_wet", e.target.value ? parseFloat(e.target.value) : undefined)
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
                      handleChange("hourly_rate_dry", e.target.value ? parseFloat(e.target.value) : undefined)
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-truehour-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-truehour-card text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.tail_number.trim()}
              className="flex-1 px-4 py-2 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Adding..." : "Add Aircraft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
