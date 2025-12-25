// TrueHour Aircraft Management View
// Manage user aircraft with FAA lookup integration

import { useEffect, useState } from "react";
import { getUserAircraft } from "../../services/api";
import type { UserAircraft } from "../../types/api";
import { AddAircraftModal } from "./AddAircraftModal";
import { EditAircraftModal } from "./EditAircraftModal";
import { SourceBadge } from "../../components/common/SourceBadge";

type SortOption =
  | "tail-asc"
  | "tail-desc"
  | "hours-asc"
  | "hours-desc"
  | "recent-asc"
  | "recent-desc"
  | "rate-asc"
  | "rate-desc";
type CategoryFilter = "all" | "rental" | "club" | "owned";

export function AircraftView() {
  const [aircraft, setAircraft] = useState<UserAircraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<UserAircraft | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("tail-asc");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  // Filter and sort aircraft
  const filterAndSortAircraft = (aircraftList: UserAircraft[]) => {
    let filtered = aircraftList;

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((ac) => ac.category === categoryFilter);
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "tail-asc":
          return a.tail_number.localeCompare(b.tail_number);
        case "tail-desc":
          return b.tail_number.localeCompare(a.tail_number);
        case "hours-asc":
          return (Number(a.total_time) || 0) - (Number(b.total_time) || 0);
        case "hours-desc":
          return (Number(b.total_time) || 0) - (Number(a.total_time) || 0);
        case "recent-asc":
          return (a.updated_at || "").localeCompare(b.updated_at || "");
        case "recent-desc":
          return (b.updated_at || "").localeCompare(a.updated_at || "");
        case "rate-asc": {
          const aRate = Number(a.hourly_rate_wet || a.hourly_rate_dry) || 0;
          const bRate = Number(b.hourly_rate_wet || b.hourly_rate_dry) || 0;
          return aRate - bRate;
        }
        case "rate-desc": {
          const aRate = Number(a.hourly_rate_wet || a.hourly_rate_dry) || 0;
          const bRate = Number(b.hourly_rate_wet || b.hourly_rate_dry) || 0;
          return bRate - aRate;
        }
        default:
          return 0;
      }
    });
  };

  // Separate aircraft and simulators
  const realAircraft = filterAndSortAircraft(aircraft.filter((ac) => !ac.is_simulator));
  const simulators = filterAndSortAircraft(aircraft.filter((ac) => ac.is_simulator));

  useEffect(() => {
    loadAircraft();
  }, [showInactive]);

  const loadAircraft = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserAircraft(showInactive ? undefined : true);
      setAircraft(data);
    } catch (err) {
      console.error("Failed to load aircraft:", err);
      setError(err instanceof Error ? err.message : "Failed to load aircraft");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAircraftAdded = () => {
    setShowAddModal(false);
    loadAircraft();
  };

  const handleAircraftUpdated = () => {
    setShowEditModal(false);
    setSelectedAircraft(null);
    loadAircraft();
  };

  const handleEditClick = (aircraft: UserAircraft) => {
    setSelectedAircraft(aircraft);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedAircraft(null);
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return "-";
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "-";
    return `$${numAmount.toFixed(2)}/hr`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">My Aircraft</h1>
          <p className="text-slate-400 mt-1">Manage your aircraft and rates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          + Add Aircraft
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-truehour-blue"></div>
          <p className="text-slate-400 mt-4">Loading aircraft...</p>
        </div>
      )}

      {/* Filters and Sort */}
      {!isLoading && (
        <div className="flex flex-wrap items-center gap-4">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="px-3 py-1.5 bg-truehour-card border border-truehour-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-truehour-blue"
            >
              <option value="all">All</option>
              <option value="rental">Rental</option>
              <option value="club">Club</option>
              <option value="owned">Owned</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 bg-truehour-card border border-truehour-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-truehour-blue"
            >
              <option value="tail-asc">Tail Number (A-Z)</option>
              <option value="tail-desc">Tail Number (Z-A)</option>
              <option value="hours-desc">Hours (Most)</option>
              <option value="hours-asc">Hours (Least)</option>
              <option value="rate-desc">Hourly Rate (Highest)</option>
              <option value="rate-asc">Hourly Rate (Lowest)</option>
              <option value="recent-desc">Latest Flight (Recent)</option>
              <option value="recent-asc">Latest Flight (Oldest)</option>
            </select>
          </div>

          {/* Show Inactive */}
          <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-truehour-border bg-truehour-card text-truehour-blue focus:ring-truehour-blue focus:ring-offset-0"
            />
            <span className="text-sm">Show inactive</span>
          </label>
        </div>
      )}

      {/* Real Aircraft Grid */}
      {!isLoading && realAircraft.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Aircraft</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {realAircraft.map((ac) => (
              <div
                key={ac.id}
                className={`bg-truehour-card border border-truehour-border rounded-lg p-4 hover:border-truehour-blue transition-colors ${
                  !ac.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Header with tail number and status */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{ac.tail_number}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ac.category && (
                        <span className="inline-block px-2 py-0.5 bg-truehour-blue/20 text-truehour-blue text-xs rounded">
                          {ac.category.charAt(0).toUpperCase() + ac.category.slice(1)}
                        </span>
                      )}
                      {ac.is_high_performance && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded">HP</span>
                      )}
                      {ac.is_complex && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">Complex</span>
                      )}
                      {ac.is_taa && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">TAA</span>
                      )}
                      <SourceBadge source={ac.data_source} faaLastChecked={ac.faa_last_checked} />
                    </div>
                  </div>
                  {!ac.is_active && (
                    <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">Inactive</span>
                  )}
                </div>

                {/* Aircraft Details */}
                <div className="space-y-2 mb-4">
                  {(ac.make || ac.model) && (
                    <div className="text-slate-300">
                      {ac.year && <span className="text-slate-400">{ac.year} </span>}
                      {ac.make && <span>{ac.make}</span>}
                      {ac.model && <span> {ac.model}</span>}
                    </div>
                  )}

                  {ac.type_code && <div className="text-sm text-slate-400">Type: {ac.type_code}</div>}

                  {ac.gear_type && <div className="text-sm text-slate-400">Gear: {ac.gear_type}</div>}

                  {/* Total Hours */}
                  {ac.total_time !== undefined && ac.total_time !== null && ac.total_time > 0 && (
                    <div className="text-sm font-semibold text-emerald-400">
                      {Number(ac.total_time).toFixed(1)} hours logged
                    </div>
                  )}
                </div>

                {/* Rates */}
                {(ac.hourly_rate_wet || ac.hourly_rate_dry) && (
                  <div className="border-t border-truehour-border pt-3 mb-4">
                    <div className="text-xs text-slate-400 mb-1">Hourly Rates</div>
                    <div className="flex gap-4">
                      {ac.hourly_rate_wet && (
                        <div>
                          <div className="text-sm text-slate-500">Wet</div>
                          <div className="text-white font-medium">{formatCurrency(ac.hourly_rate_wet)}</div>
                        </div>
                      )}
                      {ac.hourly_rate_dry && (
                        <div>
                          <div className="text-sm text-slate-500">Dry</div>
                          <div className="text-white font-medium">{formatCurrency(ac.hourly_rate_dry)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {ac.notes && (
                  <div className="border-t border-truehour-border pt-3 mb-4">
                    <div className="text-xs text-slate-400 mb-1">Notes</div>
                    <div className="text-sm text-slate-300 line-clamp-2">{ac.notes}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleEditClick(ac)}
                    className="px-4 py-2 bg-truehour-darker hover:bg-truehour-border text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => (window.location.href = `/aircraft/rates#aircraft-${ac.id}`)}
                    className="px-4 py-2 bg-truehour-blue/20 hover:bg-truehour-blue/30 text-truehour-blue hover:text-white border border-truehour-blue/30 rounded-lg transition-colors text-sm"
                  >
                    Rate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulators Grid */}
      {!isLoading && simulators.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Simulators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {simulators.map((ac) => (
              <div
                key={ac.id}
                className={`bg-truehour-card border border-truehour-border rounded-lg p-4 hover:border-green-500/50 transition-colors ${
                  !ac.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Header with tail number */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{ac.tail_number}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">Simulator</span>
                    </div>
                  </div>
                  {!ac.is_active && (
                    <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded">Inactive</span>
                  )}
                </div>

                {/* Simulator Details */}
                <div className="space-y-2 mb-4">
                  {(ac.make || ac.model) && (
                    <div className="text-slate-300">
                      {ac.make && <span>{ac.make}</span>}
                      {ac.model && <span> {ac.model}</span>}
                    </div>
                  )}

                  {ac.type_code && <div className="text-sm text-slate-400">Type: {ac.type_code}</div>}

                  {/* Total Hours */}
                  {ac.total_time !== undefined && ac.total_time !== null && ac.total_time > 0 && (
                    <div className="text-sm font-semibold text-emerald-400">
                      {Number(ac.total_time).toFixed(1)} hours logged
                    </div>
                  )}
                </div>

                {/* Notes */}
                {ac.notes && (
                  <div className="border-t border-truehour-border pt-3 mb-4">
                    <div className="text-xs text-slate-400 mb-1">Notes</div>
                    <div className="text-sm text-slate-300 line-clamp-2">{ac.notes}</div>
                  </div>
                )}

                {/* Edit Button */}
                <button
                  onClick={() => handleEditClick(ac)}
                  className="w-full px-4 py-2 bg-truehour-darker hover:bg-truehour-border text-slate-300 hover:text-white rounded-lg transition-colors text-sm"
                >
                  Edit Simulator
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && aircraft.length === 0 && (
        <div className="text-center py-12 bg-truehour-card border border-truehour-border rounded-lg">
          <svg className="mx-auto h-12 w-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <h3 className="text-lg font-medium text-slate-300 mb-2">No aircraft found</h3>
          <p className="text-slate-400 mb-4">Add your first aircraft to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Add Aircraft
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddModal && <AddAircraftModal onClose={() => setShowAddModal(false)} onSuccess={handleAircraftAdded} />}

      {showEditModal && selectedAircraft && (
        <EditAircraftModal
          aircraft={selectedAircraft}
          onClose={handleCloseEditModal}
          onSuccess={handleAircraftUpdated}
        />
      )}
    </div>
  );
}
