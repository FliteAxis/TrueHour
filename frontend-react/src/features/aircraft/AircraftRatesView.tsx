// Aircraft Rates Configuration View
// Dedicated page for managing aircraft hourly rates

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { UserAircraft } from "../../types/api";

type RateType = "wet" | "dry" | "owned";

interface RateFormData {
  rate_type: RateType;
  hourly_rate_wet?: number;
  hourly_rate_dry?: number;
  fuel_burn_rate?: number;
  fuel_price_per_gallon?: number;
  operating_cost_per_hour?: number;
}

export function AircraftRatesView() {
  const navigate = useNavigate();
  const [aircraft, setAircraft] = useState<UserAircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Track rate data for each aircraft
  const [rateData, setRateData] = useState<Record<number, RateFormData>>({});

  useEffect(() => {
    loadAircraft();
  }, []);

  // Scroll to aircraft if hash is present
  useEffect(() => {
    if (aircraft.length > 0) {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            // Briefly highlight the card
            element.classList.add("ring-2", "ring-truehour-blue");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-truehour-blue");
            }, 2000);
          }, 100);
        }
      }
    }
  }, [aircraft]);

  const loadAircraft = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/api/user/aircraft?is_active=true");
      if (!response.ok) throw new Error("Failed to load aircraft");

      const data: UserAircraft[] = await response.json();

      // Filter out simulators
      const realAircraft = data.filter((ac) => !ac.is_simulator);
      setAircraft(realAircraft);

      // Initialize rate data from existing aircraft data
      const initialRates: Record<number, RateFormData> = {};
      realAircraft.forEach((ac) => {
        // Determine rate type based on existing data
        let rateType: RateType = "wet";
        if (ac.category === "owned") {
          rateType = "owned";
        } else if (ac.hourly_rate_dry && ac.fuel_burn_rate && ac.fuel_price_per_gallon) {
          rateType = "dry";
        } else if (ac.hourly_rate_wet) {
          rateType = "wet";
        }

        initialRates[ac.id] = {
          rate_type: rateType,
          hourly_rate_wet: ac.hourly_rate_wet || undefined,
          hourly_rate_dry: ac.hourly_rate_dry || undefined,
          fuel_burn_rate: ac.fuel_burn_rate || undefined,
          fuel_price_per_gallon: ac.fuel_price_per_gallon || undefined,
          operating_cost_per_hour: undefined, // Will be calculated or entered
        };
      });
      setRateData(initialRates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load aircraft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRateTypeChange = (aircraftId: number, rateType: RateType) => {
    setRateData((prev) => ({
      ...prev,
      [aircraftId]: {
        ...prev[aircraftId],
        rate_type: rateType,
      },
    }));
  };

  const handleFieldChange = (aircraftId: number, field: keyof RateFormData, value: number | undefined) => {
    setRateData((prev) => ({
      ...prev,
      [aircraftId]: {
        ...prev[aircraftId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (aircraftId: number) => {
    setIsSaving(aircraftId);
    setError(null);
    setSuccessMessage(null);

    const rates = rateData[aircraftId];
    if (!rates) return;

    try {
      // Prepare update data based on rate type
      const updateData: Partial<UserAircraft> = {};

      if (rates.rate_type === "wet") {
        if (!rates.hourly_rate_wet) {
          throw new Error("Please enter a wet rate");
        }
        updateData.hourly_rate_wet = rates.hourly_rate_wet;
        updateData.hourly_rate_dry = null;
      } else if (rates.rate_type === "dry") {
        if (!rates.hourly_rate_dry || !rates.fuel_burn_rate || !rates.fuel_price_per_gallon) {
          throw new Error("Please fill in all dry rate fields");
        }
        updateData.hourly_rate_dry = rates.hourly_rate_dry;
        updateData.fuel_burn_rate = rates.fuel_burn_rate;
        updateData.fuel_price_per_gallon = rates.fuel_price_per_gallon;
        updateData.hourly_rate_wet = null;
      } else if (rates.rate_type === "owned") {
        if (!rates.fuel_burn_rate || !rates.fuel_price_per_gallon || !rates.operating_cost_per_hour) {
          throw new Error("Please fill in all owned aircraft fields");
        }
        updateData.fuel_burn_rate = rates.fuel_burn_rate;
        updateData.fuel_price_per_gallon = rates.fuel_price_per_gallon;
        // For owned, store operating cost in dry rate field for simplicity
        updateData.hourly_rate_dry = rates.operating_cost_per_hour;
        updateData.hourly_rate_wet = null;
        updateData.category = "owned";
      }

      const response = await fetch(`http://localhost:8000/api/user/aircraft/${aircraftId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save rates");
      }

      setSuccessMessage("Rates saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);

      // Reload aircraft to get updated data
      await loadAircraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rates");
    } finally {
      setIsSaving(null);
    }
  };

  const getCalculatedTotal = (aircraftId: number): string | null => {
    const rates = rateData[aircraftId];
    if (!rates) return null;

    if (rates.rate_type === "wet" && rates.hourly_rate_wet) {
      const wetRate = Number(rates.hourly_rate_wet);
      if (isNaN(wetRate)) return null;
      return `$${wetRate.toFixed(2)}/hr (wet)`;
    } else if (rates.rate_type === "dry") {
      if (rates.hourly_rate_dry && rates.fuel_burn_rate && rates.fuel_price_per_gallon) {
        const dryRate = Number(rates.hourly_rate_dry);
        const fuelBurn = Number(rates.fuel_burn_rate);
        const fuelPrice = Number(rates.fuel_price_per_gallon);
        if (isNaN(dryRate) || isNaN(fuelBurn) || isNaN(fuelPrice)) return null;
        const fuelCost = fuelBurn * fuelPrice;
        const total = dryRate + fuelCost;
        return `$${total.toFixed(2)}/hr (dry: $${dryRate.toFixed(2)} + fuel: $${fuelCost.toFixed(2)})`;
      }
    } else if (rates.rate_type === "owned") {
      if (rates.fuel_burn_rate && rates.fuel_price_per_gallon && rates.operating_cost_per_hour) {
        const operatingCost = Number(rates.operating_cost_per_hour);
        const fuelBurn = Number(rates.fuel_burn_rate);
        const fuelPrice = Number(rates.fuel_price_per_gallon);
        if (isNaN(operatingCost) || isNaN(fuelBurn) || isNaN(fuelPrice)) return null;
        const fuelCost = fuelBurn * fuelPrice;
        const total = operatingCost + fuelCost;
        return `$${total.toFixed(2)}/hr (operating: $${operatingCost.toFixed(2)} + fuel: $${fuelCost.toFixed(2)})`;
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-truehour-blue mb-4"></div>
          <p className="text-slate-400">Loading aircraft...</p>
        </div>
      </div>
    );
  }

  if (aircraft.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Aircraft Rates</h1>
          <p className="text-slate-400 mt-1">Configure hourly rates for your aircraft</p>
        </div>

        {/* Empty State */}
        <div className="bg-truehour-card border border-truehour-border rounded-lg p-12 text-center">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No Aircraft Found</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            You need to add aircraft before you can configure rates. Add aircraft from the My Aircraft page.
          </p>
          <button
            onClick={() => navigate("/aircraft")}
            className="px-6 py-3 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Go to My Aircraft
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Aircraft Rates</h1>
        <p className="text-slate-400 mt-1">Configure hourly rates for flight training and budgeting</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Rate Type Info */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rate Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-truehour-darker border border-truehour-border rounded-lg">
            <div className="text-truehour-blue font-semibold mb-2">Wet Rate</div>
            <p className="text-sm text-slate-400">All-inclusive hourly rate (fuel included)</p>
          </div>
          <div className="p-4 bg-truehour-darker border border-truehour-border rounded-lg">
            <div className="text-truehour-blue font-semibold mb-2">Dry Rate</div>
            <p className="text-sm text-slate-400">Aircraft rental + fuel charged separately</p>
          </div>
          <div className="p-4 bg-truehour-darker border border-truehour-border rounded-lg">
            <div className="text-truehour-blue font-semibold mb-2">Owned</div>
            <p className="text-sm text-slate-400">Your aircraft - track operating + fuel costs</p>
          </div>
        </div>
      </div>

      {/* Aircraft Rates List */}
      <div className="space-y-4">
        {aircraft.map((ac) => {
          const rates = rateData[ac.id];
          if (!rates) return null;

          const calculatedTotal = getCalculatedTotal(ac.id);
          const isSavingThis = isSaving === ac.id;

          return (
            <div key={ac.id} className="bg-truehour-card border border-truehour-border rounded-lg p-6">
              {/* Aircraft Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {ac.tail_number}
                    {ac.make && ac.model && (
                      <span className="text-slate-400 font-normal ml-2">
                        ({ac.make} {ac.model})
                      </span>
                    )}
                  </h3>
                  {calculatedTotal && <p className="text-sm text-truehour-green mt-1 font-medium">{calculatedTotal}</p>}
                </div>
              </div>

              {/* Rate Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">Rate Type</label>
                <div className="flex gap-3">
                  {(["wet", "dry", "owned"] as RateType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => handleRateTypeChange(ac.id, type)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                        rates.rate_type === type
                          ? "bg-truehour-blue/20 border-truehour-blue text-white"
                          : "bg-truehour-darker border-truehour-border text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      <div className="font-semibold capitalize">{type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {rates.rate_type === "wet" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hourly Rate (Wet) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={rates.hourly_rate_wet || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            ac.id,
                            "hourly_rate_wet",
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                {rates.rate_type === "dry" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Hourly Rate (Dry) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={rates.hourly_rate_dry || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              ac.id,
                              "hourly_rate_dry",
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fuel Burn (gal/hr) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={rates.fuel_burn_rate || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            ac.id,
                            "fuel_burn_rate",
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                        placeholder="0.0"
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fuel Price ($/gal) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={rates.fuel_price_per_gallon || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              ac.id,
                              "fuel_price_per_gallon",
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {rates.rate_type === "owned" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Operating Cost ($/hr) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={rates.operating_cost_per_hour || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              ac.id,
                              "operating_cost_per_hour",
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Maintenance, insurance, etc.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fuel Burn (gal/hr) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        value={rates.fuel_burn_rate || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            ac.id,
                            "fuel_burn_rate",
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg px-4 py-2 focus:outline-none focus:border-truehour-blue"
                        placeholder="0.0"
                        step="0.1"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fuel Price ($/gal) <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={rates.fuel_price_per_gallon || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              ac.id,
                              "fuel_price_per_gallon",
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          className="w-full bg-truehour-darker border border-truehour-border text-white rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-truehour-blue"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => handleSave(ac.id)}
                  disabled={isSavingThis}
                  className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingThis ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Rates"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
