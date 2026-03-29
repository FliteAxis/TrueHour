// Quick Start Budget Cards Modal
// Provides template cards for common aviation expenses

import { useState, useEffect } from "react";
import { useBudgetStore } from "../../store/budgetStore";
import { useUserStore } from "../../store/userStore";
import type { UserAircraft } from "../../types/api";

interface TemplateCard {
  name: string;
  amount: number;
  category: string;
  description: string;
  icon: string;
  isOneTime: boolean;
  supportsAircraft?: boolean; // New: indicates if this template can link to aircraft
}

const TEMPLATE_CARDS: TemplateCard[] = [
  {
    name: "Flight Instruction",
    amount: 5000,
    category: "Training",
    description: "Flight and ground instruction costs",
    icon: "",
    isOneTime: false,
    supportsAircraft: true,
  },
  {
    name: "Aircraft Rental",
    amount: 8000,
    category: "Aircraft Rental",
    description: "Aircraft rental for training flights",
    icon: "",
    isOneTime: false,
    supportsAircraft: true,
  },
  {
    name: "Medical Exam",
    amount: 300,
    category: "Medical",
    description: "FAA medical examination",
    icon: "",
    isOneTime: true,
  },
  {
    name: "FAA Knowledge Test",
    amount: 250,
    category: "Exams & Checkrides",
    description: "Written exam fee",
    icon: "",
    isOneTime: true,
  },
  {
    name: "Checkride",
    amount: 1000,
    category: "Exams & Checkrides",
    description: "Practical exam with DPE",
    icon: "",
    isOneTime: true,
    supportsAircraft: true,
  },
  {
    name: "Aviation Headset",
    amount: 500,
    category: "Equipment",
    description: "Headset and accessories",
    icon: "",
    isOneTime: true,
  },
  {
    name: "Books & Materials",
    amount: 300,
    category: "Books & Materials",
    description: "Training materials and books",
    icon: "",
    isOneTime: true,
  },
  {
    name: "ForeFlight Subscription",
    amount: 275,
    category: "Subscriptions",
    description: "Annual subscription",
    icon: "",
    isOneTime: false,
  },
  {
    name: "Ground School",
    amount: 300,
    category: "Ground School",
    description: "Online or in-person ground school",
    icon: "",
    isOneTime: true,
  },
];

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickStartModal({ isOpen, onClose }: QuickStartModalProps) {
  const { selectedYear, createCard, loadCards } = useBudgetStore();
  const { settings, currentHours } = useUserStore();
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aircraft, setAircraft] = useState<UserAircraft[]>([]);
  const [isLoadingAircraft, setIsLoadingAircraft] = useState(false);

  // Aircraft configuration for templates that support it
  const [aircraftConfig, setAircraftConfig] = useState<{
    [templateIndex: number]: {
      aircraft_id?: number;
      hours?: number;
      rate_type: "wet" | "dry";
    };
  }>({});

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
    const suggestedHours = Math.ceil(remainingHours * bufferMultiplier * 10) / 10; // Round to 1 decimal

    return {
      hours: suggestedHours,
      remainingHours,
      certName: settings.target_certification.toUpperCase(),
    };
  };

  if (!isOpen) return null;

  const toggleTemplate = (index: number) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTemplates(newSelected);
  };

  const selectAllTemplates = () => {
    const allIndices = new Set(TEMPLATE_CARDS.map((_, index) => index));
    setSelectedTemplates(allIndices);
  };

  const createAllTemplates = async () => {
    // If aircraft exist, just select all templates and let user configure via UI
    if (aircraft.length > 0) {
      selectAllTemplates();
      return;
    }

    // No aircraft available - create all with defaults immediately
    setIsCreating(true);
    setError(null);
    try {
      // Create all template cards with default amounts
      for (let i = 0; i < TEMPLATE_CARDS.length; i++) {
        const template = TEMPLATE_CARDS[i];

        await createCard({
          name: template.name,
          budgeted_amount: template.amount,
          category: template.category,
          notes: template.description,
          frequency: template.isOneTime ? "once" : "annual",
          when_date: `${selectedYear}-01-01`,
          status: "active",
        });
      }

      // Reload cards to show the new ones
      await loadCards(selectedYear);

      onClose();
    } catch (err) {
      console.error("Failed to create template cards:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create budget cards";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const createSelectedTemplates = async () => {
    if (selectedTemplates.size === 0) {
      setError("Please select at least one template card");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      // Create only selected template cards
      for (const index of Array.from(selectedTemplates)) {
        const template = TEMPLATE_CARDS[index];
        const config = aircraftConfig[index];

        await createCard({
          name: template.name,
          budgeted_amount: template.amount,
          category: template.category,
          notes: template.description,
          frequency: template.isOneTime ? "once" : "annual",
          when_date: `${selectedYear}-01-01`,
          status: "active",
          // Include aircraft configuration if provided
          aircraft_id: config?.aircraft_id,
          associated_hours: config?.hours,
          hourly_rate_type: config?.aircraft_id ? config?.rate_type : undefined,
        });
      }

      // Reload cards to show the new ones
      await loadCards(selectedYear);

      onClose();
    } catch (err) {
      console.error("Failed to create selected template cards:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create budget cards";
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-truehour-darker border border-truehour-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border">
          <h2 className="text-2xl font-bold text-white">Quick Start Budget Cards</h2>
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

        {/* Description */}
        <div className="px-6 py-4 border-b border-truehour-border">
          <p className="text-slate-400">
            Select templates to quickly create budget cards for common aviation expenses. Click any card to add it to
            your budget.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Template Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_CARDS.map((template, index) => (
              <div key={index} className="flex flex-col">
                <button
                  onClick={() => toggleTemplate(index)}
                  className={`bg-truehour-card border-2 rounded-lg p-6 text-left transition-all hover:border-truehour-blue/50 ${
                    selectedTemplates.has(index) ? "border-truehour-blue bg-truehour-blue/10" : "border-truehour-border"
                  }`}
                >
                  {/* Name */}
                  <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>

                  {/* Amount */}
                  <div className="text-2xl font-bold text-truehour-blue mb-2">
                    ${template.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400">{template.description}</p>

                  {/* Selection indicator */}
                  {selectedTemplates.has(index) && (
                    <div className="mt-4 flex items-center gap-2 text-truehour-blue">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </button>

                {/* Aircraft Configuration (only for templates that support it and are selected) */}
                {template.supportsAircraft && selectedTemplates.has(index) && (
                  <div className="mt-3 p-4 bg-truehour-darker border border-truehour-border rounded-lg space-y-3">
                    <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                      Link Aircraft (Optional)
                    </h4>

                    {/* Aircraft Selector */}
                    <select
                      value={aircraftConfig[index]?.aircraft_id || ""}
                      onChange={(e) => {
                        const aircraftId = e.target.value ? parseInt(e.target.value) : undefined;
                        setAircraftConfig({
                          ...aircraftConfig,
                          [index]: {
                            ...aircraftConfig[index],
                            aircraft_id: aircraftId,
                            rate_type: aircraftConfig[index]?.rate_type || "wet",
                          },
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-truehour-card border border-truehour-border text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-truehour-blue"
                      disabled={isLoadingAircraft}
                    >
                      <option value="">None (Manual amount)</option>
                      {aircraft.map((ac) => (
                        <option key={ac.id} value={ac.id}>
                          {ac.tail_number} - {ac.make} {ac.model}
                        </option>
                      ))}
                    </select>

                    {/* Hours and Rate Type (only show if aircraft selected) */}
                    {aircraftConfig[index]?.aircraft_id && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Hours</label>
                            <input
                              type="number"
                              value={aircraftConfig[index]?.hours || ""}
                              onChange={(e) => {
                                setAircraftConfig({
                                  ...aircraftConfig,
                                  [index]: {
                                    ...aircraftConfig[index],
                                    aircraft_id: aircraftConfig[index]?.aircraft_id,
                                    hours: e.target.value ? parseFloat(e.target.value) : undefined,
                                    rate_type: aircraftConfig[index]?.rate_type || "wet",
                                  },
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-truehour-card border border-truehour-border text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-truehour-blue"
                              placeholder="0.0"
                              step="0.1"
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Rate Type</label>
                            <select
                              value={aircraftConfig[index]?.rate_type || "wet"}
                              onChange={(e) => {
                                setAircraftConfig({
                                  ...aircraftConfig,
                                  [index]: {
                                    ...aircraftConfig[index],
                                    aircraft_id: aircraftConfig[index]?.aircraft_id,
                                    rate_type: e.target.value as "wet" | "dry",
                                  },
                                });
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full bg-truehour-card border border-truehour-border text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-truehour-blue"
                            >
                              <option value="wet">Wet</option>
                              <option value="dry">Dry</option>
                            </select>
                          </div>
                        </div>
                        {(() => {
                          const suggestion = getSuggestedHours();
                          return (
                            <div className="space-y-1">
                              {suggestion ? (
                                <div className="flex items-start gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded">
                                  <svg
                                    className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"
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
                                  <div className="text-xs text-blue-300">
                                    <div className="font-medium">Suggested: ~{suggestion.hours.toFixed(1)} hrs</div>
                                    <div className="text-blue-400/80 mt-0.5">
                                      Based on {suggestion.certName} progress ({suggestion.remainingHours.toFixed(1)}{" "}
                                      hrs remaining + {settings?.budget_buffer_percentage || 10}% buffer)
                                    </div>
                                  </div>
                                </div>
                              ) : !settings?.target_certification || !currentHours ? (
                                <div className="flex items-start gap-2 p-2 bg-slate-500/10 border border-slate-500/20 rounded">
                                  <svg
                                    className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"
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
                                  <div className="text-xs text-slate-400">
                                    <div className="font-medium">No hour suggestion available</div>
                                    <div className="mt-0.5">
                                      Set a target certification on your dashboard and log flight hours to see smart
                                      suggestions
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                              <p className="text-xs text-slate-400 italic">
                                Budget amount will be calculated as hours × aircraft rate
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-truehour-border gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-truehour-card border border-truehour-border text-white rounded-lg hover:bg-truehour-darker transition-colors"
            disabled={isCreating}
          >
            Close
          </button>

          <div className="flex gap-4">
            <button
              onClick={createAllTemplates}
              className="px-6 py-3 bg-truehour-card border border-truehour-blue text-truehour-blue rounded-lg hover:bg-truehour-blue/10 transition-colors disabled:opacity-50"
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create All Templates"}
            </button>

            <button
              onClick={createSelectedTemplates}
              className="px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isCreating || selectedTemplates.size === 0}
            >
              {isCreating ? "Creating..." : `Create Selected (${selectedTemplates.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
