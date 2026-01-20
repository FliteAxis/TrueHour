// Create Budget Card Modal
// Modal form for creating new budget cards

import { useState, useEffect } from "react";
import { useBudgetStore } from "../../store/budgetStore";
import { useUserStore } from "../../store/userStore";
import type { UserAircraft, CostCalculation } from "../../types/api";

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CATEGORIES = [
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

export function CreateCardModal({ isOpen, onClose }: CreateCardModalProps) {
  const { createCard } = useBudgetStore();
  const { settings, currentHours } = useUserStore();

  // Get categories from settings or use defaults
  // Keep Training first, then alphabetize the rest
  const categories =
    settings?.budget_categories && settings.budget_categories.length > 0
      ? ["Training", ...settings.budget_categories.filter((c) => c !== "Training").sort()]
      : DEFAULT_CATEGORIES;

  // Helper to check if category should show aircraft selector
  const shouldShowAircraftFields = (category: string) => {
    return category === "Training" || category === "Aircraft Rental" || category === "Exams & Checkrides";
  };

  const [formData, setFormData] = useState({
    name: "",
    category: "Training",
    frequency: "once",
    when_date: new Date().toISOString().split("T")[0],
    budgeted_amount: "",
    status: "active",
    notes: "",
    associated_hours: "",
    aircraft_id: "",
    hourly_rate_type: "wet" as "wet" | "dry",
  });

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aircraft, setAircraft] = useState<UserAircraft[]>([]);
  const [isLoadingAircraft, setIsLoadingAircraft] = useState(false);
  const [costCalculation, setCostCalculation] = useState<CostCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [includeBuffer, setIncludeBuffer] = useState(true);

  // Load aircraft on mount
  useEffect(() => {
    const loadAircraft = async () => {
      setIsLoadingAircraft(true);
      try {
        const response = await fetch("http://localhost:8000/api/user/aircraft?is_active=true");
        if (response.ok) {
          const data = await response.json();
          setAircraft(data);
        }
      } catch (err) {
        console.error("Failed to load aircraft:", err);
      } finally {
        setIsLoadingAircraft(false);
      }
    };

    if (isOpen) {
      loadAircraft();
    }
  }, [isOpen]);

  // Auto-populate default training aircraft when modal opens with Training category
  useEffect(() => {
    if (
      isOpen &&
      settings?.default_training_aircraft_id &&
      shouldShowAircraftFields(formData.category) &&
      !formData.aircraft_id
    ) {
      setFormData((prev) => ({
        ...prev,
        aircraft_id: settings.default_training_aircraft_id?.toString() || "",
      }));
    }
  }, [isOpen, settings?.default_training_aircraft_id]);

  // Calculate suggested hours based on certification progress and training settings
  const getSuggestedHours = () => {
    if (!settings?.target_certification || !currentHours) {
      return null;
    }

    // Certification requirements mapping
    const certRequirements: Record<string, { totalHours: number; field: keyof typeof currentHours }> = {
      private: { totalHours: 40, field: "total" },
      ir: { totalHours: 40, field: "instrument_total" },
      cpl: { totalHours: 250, field: "total" },
      cfi: { totalHours: 250, field: "total" },
    };

    const cert = certRequirements[settings.target_certification];
    if (!cert) return null;

    const currentValue = currentHours[cert.field] || 0;
    const remainingHours = Math.max(0, cert.totalHours - Number(currentValue));

    if (remainingHours === 0) return null;

    // Apply buffer percentage
    const bufferMultiplier = 1 + (settings?.budget_buffer_percentage || 10) / 100;
    const totalWithBuffer = Math.ceil(remainingHours * bufferMultiplier * 10) / 10;

    // Get training hours per week from settings
    const hoursPerWeek = settings?.training_hours_per_week || 2.0;
    const bufferPercent = settings?.budget_buffer_percentage || 10;

    // Calculate based on frequency
    let suggestedHours = totalWithBuffer;
    let explanation = "";
    let frequencyAdvice = "";

    // Check if instructor rate is configured
    const instructorRate = settings?.ground_instruction_rate || 0;
    const instructorNote = instructorRate > 0 ? ` (includes $${instructorRate}/hr instructor rate)` : "";

    if (formData.frequency === "monthly") {
      // Monthly: hours per week × 4 weeks
      suggestedHours = Math.ceil(hoursPerWeek * 4 * 10) / 10;
      const monthsToComplete = Math.ceil(totalWithBuffer / suggestedHours);
      explanation = `${hoursPerWeek} hrs/week × 4 weeks = ${suggestedHours.toFixed(1)} hrs/month${instructorNote}`;
      frequencyAdvice = `${remainingHours.toFixed(1)} hrs remaining (+${bufferPercent}% buffer) ≈ ${monthsToComplete} months to complete ${settings.target_certification.toUpperCase()}`;
    } else if (formData.frequency === "annual") {
      // Annual: hours per week × 52 weeks
      suggestedHours = Math.ceil(hoursPerWeek * 52 * 10) / 10;
      const yearsToComplete = (totalWithBuffer / suggestedHours).toFixed(1);
      explanation = `${hoursPerWeek} hrs/week × 52 weeks = ${suggestedHours.toFixed(1)} hrs/year${instructorNote}`;
      frequencyAdvice = `${remainingHours.toFixed(1)} hrs remaining (+${bufferPercent}% buffer) ≈ ${yearsToComplete} years to complete ${settings.target_certification.toUpperCase()}`;
    } else {
      // One-time: use total remaining hours with buffer
      suggestedHours = totalWithBuffer;
      explanation = `${remainingHours.toFixed(1)} hrs remaining +${bufferPercent}% buffer = ${totalWithBuffer.toFixed(1)} hrs total${instructorNote}`;
      frequencyAdvice = `Complete entire ${settings.target_certification.toUpperCase()} certification in one payment`;
    }

    return {
      hours: suggestedHours,
      remainingHours,
      certName: settings.target_certification.toUpperCase(),
      explanation,
      frequencyAdvice,
      bufferPercent,
    };
  };

  const handleCalculateCost = async () => {
    if (!formData.aircraft_id || !formData.associated_hours) {
      setError("Please select an aircraft and enter hours to calculate cost");
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Apply buffer to hours if checkbox is checked
      const bufferMultiplier = includeBuffer ? 1 + (settings?.budget_buffer_percentage || 10) / 100 : 1;
      const hoursWithBuffer = parseFloat(formData.associated_hours) * bufferMultiplier;

      const response = await fetch(
        `http://localhost:8000/api/user/budget-cards/calculate-cost?aircraft_id=${formData.aircraft_id}&hours=${hoursWithBuffer}&rate_type=${formData.hourly_rate_type}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to calculate cost");
      }

      const calculation: CostCalculation = await response.json();
      setCostCalculation(calculation);

      // Auto-fill the budgeted amount
      setFormData({ ...formData, budgeted_amount: calculation.total_cost.toFixed(2) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate cost");
    } finally {
      setIsCalculating(false);
    }
  };

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
      await createCard({
        name: formData.name.trim(),
        category: formData.category,
        frequency: formData.frequency,
        when_date: formData.when_date,
        budgeted_amount: parseFloat(formData.budgeted_amount),
        status: formData.status,
        notes: formData.notes.trim(),
        tags: tags.length > 0 ? tags : undefined,
        associated_hours: formData.associated_hours ? parseFloat(formData.associated_hours) : undefined,
        aircraft_id: formData.aircraft_id ? parseInt(formData.aircraft_id) : undefined,
        hourly_rate_type: formData.aircraft_id ? formData.hourly_rate_type : undefined,
      });

      // Reset form and close
      setFormData({
        name: "",
        category: "Training",
        frequency: "once",
        when_date: new Date().toISOString().split("T")[0],
        budgeted_amount: "",
        status: "active",
        notes: "",
        associated_hours: "",
        aircraft_id: "",
        hourly_rate_type: "wet",
      });
      setTags([]);
      setTagInput("");
      setCostCalculation(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create budget card");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: "",
        category: "Training",
        frequency: "once",
        when_date: new Date().toISOString().split("T")[0],
        budgeted_amount: "",
        status: "active",
        notes: "",
        associated_hours: "",
        aircraft_id: "",
        hourly_rate_type: "wet",
      });
      setTags([]);
      setTagInput("");
      setCostCalculation(null);
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
          <h2 className="text-2xl font-bold text-white">Create Budget Card</h2>
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
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
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
                <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    const updates: any = { category: newCategory };

                    // Auto-populate default training aircraft when aircraft-eligible category is selected
                    if (shouldShowAircraftFields(newCategory) && settings?.default_training_aircraft_id) {
                      updates.aircraft_id = settings.default_training_aircraft_id.toString();
                    }

                    setFormData({ ...formData, ...updates });
                  }}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-slate-300 mb-2">
                  Frequency <span className="text-red-400">*</span>
                </label>
                <select
                  id="frequency"
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
                <label htmlFor="when_date" className="block text-sm font-medium text-slate-300 mb-2">
                  Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  id="when_date"
                  value={formData.when_date}
                  onChange={(e) => setFormData({ ...formData, when_date: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <select
                  id="status"
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

            {/* Aircraft Training Section - Show for Training, Aircraft Rental, and Exams & Checkrides */}
            {shouldShowAircraftFields(formData.category) && (
              <div className="p-4 bg-truehour-darker border border-truehour-border rounded-lg space-y-4">
                <h3 className="text-sm font-semibold text-white mb-3">Aircraft & Flight Details</h3>

                {/* Aircraft Selector */}
                <div>
                  <label htmlFor="aircraft_id" className="block text-sm font-medium text-slate-300 mb-2">
                    Aircraft
                  </label>
                  <select
                    id="aircraft_id"
                    value={formData.aircraft_id}
                    onChange={(e) => {
                      setFormData({ ...formData, aircraft_id: e.target.value });
                      setCostCalculation(null);
                    }}
                    className="w-full bg-truehour-card border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                    disabled={isLoadingAircraft}
                  >
                    <option value="">None (Manual entry)</option>
                    {aircraft.map((ac) => (
                      <option key={ac.id} value={ac.id}>
                        {ac.tail_number} - {ac.make} {ac.model}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.aircraft_id && (
                  <>
                    {/* Hours and Rate Type */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="associated_hours" className="block text-sm font-medium text-slate-300 mb-2">
                            Hours
                          </label>
                          <input
                            type="number"
                            id="associated_hours"
                            value={formData.associated_hours}
                            onChange={(e) => {
                              setFormData({ ...formData, associated_hours: e.target.value });
                              setCostCalculation(null);
                            }}
                            className="w-full bg-truehour-card border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                            placeholder="0.0"
                            step="0.1"
                            min="0"
                          />
                        </div>

                        <div>
                          <label htmlFor="hourly_rate_type" className="block text-sm font-medium text-slate-300 mb-2">
                            Rate Type
                          </label>
                          <select
                            id="hourly_rate_type"
                            value={formData.hourly_rate_type}
                            onChange={(e) => {
                              setFormData({ ...formData, hourly_rate_type: e.target.value as "wet" | "dry" });
                              setCostCalculation(null);
                            }}
                            className="w-full bg-truehour-card border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                          >
                            <option value="wet">Wet</option>
                            <option value="dry">Dry</option>
                          </select>
                        </div>
                      </div>

                      {/* Include Buffer Checkbox */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeBuffer"
                          checked={includeBuffer}
                          onChange={(e) => {
                            setIncludeBuffer(e.target.checked);
                            setCostCalculation(null);
                          }}
                          className="w-4 h-4 rounded border-truehour-border bg-truehour-card text-truehour-blue focus:ring-2 focus:ring-truehour-blue focus:ring-offset-0"
                        />
                        <label htmlFor="includeBuffer" className="text-sm text-slate-300 cursor-pointer">
                          Include {settings?.budget_buffer_percentage || 10}% buffer in cost calculation
                        </label>
                      </div>

                      {/* Smart Hour Suggestion */}
                      {(() => {
                        const suggestion = getSuggestedHours();
                        return suggestion ? (
                          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <svg
                              className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div className="text-sm text-blue-300 flex-1">
                              <div className="font-medium">Suggested: ~{suggestion.hours.toFixed(1)} hrs</div>
                              <div className="text-blue-400/80 mt-1 space-y-1">
                                <div>{suggestion.explanation}</div>
                                <div className="text-xs italic">{suggestion.frequencyAdvice}</div>
                              </div>
                            </div>
                          </div>
                        ) : !settings?.target_certification || !currentHours ? (
                          <div className="flex items-start gap-2 p-3 bg-slate-500/10 border border-slate-500/20 rounded-lg">
                            <svg
                              className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <div className="text-sm text-slate-400">
                              <div className="font-medium">No hour suggestion available</div>
                              <div className="mt-1">
                                Set a target certification on your dashboard and log flight hours to see smart
                                suggestions
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Calculate Button */}
                    <button
                      type="button"
                      onClick={handleCalculateCost}
                      disabled={!formData.aircraft_id || !formData.associated_hours || isCalculating}
                      className="w-full px-4 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isCalculating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          Calculate Cost
                        </>
                      )}
                    </button>

                    {/* Calculation Display */}
                    {costCalculation && (
                      <div className="p-3 bg-green-900/20 border border-green-500/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-green-400">Calculated Cost</div>
                          {includeBuffer && (
                            <div className="text-xs text-green-400/70">
                              +{settings?.budget_buffer_percentage || 10}% buffer
                            </div>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-green-300">
                          ${costCalculation.total_cost.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-300 space-y-1">
                          <div>{costCalculation.calculation}</div>
                          {costCalculation.instructor_rate && costCalculation.instructor_rate > 0 && (
                            <div className="pt-1 border-t border-green-500/30">
                              <div className="flex justify-between">
                                <span>Aircraft Rate:</span>
                                <span>
                                  $
                                  {(
                                    costCalculation.aircraft_hourly_rate ||
                                    costCalculation.aircraft_total_rate ||
                                    0
                                  ).toFixed(2)}
                                  /hr
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Instructor Rate:</span>
                                <span>${costCalculation.instructor_rate.toFixed(2)}/hr</span>
                              </div>
                              <div className="flex justify-between font-medium text-green-300">
                                <span>Total Rate:</span>
                                <span>${costCalculation.total_hourly_rate?.toFixed(2)}/hr</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Budgeted Amount */}
            <div>
              <label htmlFor="budgeted_amount" className="block text-sm font-medium text-slate-300 mb-2">
                Budgeted Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                <input
                  type="number"
                  id="budgeted_amount"
                  value={formData.budgeted_amount}
                  onChange={(e) => setFormData({ ...formData, budgeted_amount: e.target.value })}
                  className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Actual amounts are calculated from linked expenses</p>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-300 mb-2">
                Tags (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  id="tags"
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
              <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
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
                  Creating...
                </>
              ) : (
                "Create Budget Card"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
