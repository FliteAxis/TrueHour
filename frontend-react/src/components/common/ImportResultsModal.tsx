// Import Results Modal
// Shows detailed results after ForeFlight CSV import with aircraft review

import { SourceBadge } from "./SourceBadge";

interface ImportedAircraft {
  id: number;
  tail_number: string;
  make?: string;
  model?: string;
  year?: number;
  data_source?: "faa" | "foreflight" | "manual";
  total_time?: number;
}

interface ImportResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  flightsImported: number;
  flightsSkipped: number;
  aircraft: ImportedAircraft[];
  errors?: string[];
}

export function ImportResultsModal({
  isOpen,
  onClose,
  flightsImported,
  flightsSkipped,
  aircraft,
  errors = [],
}: ImportResultsModalProps) {
  if (!isOpen) return null;

  const faaAircraft = aircraft.filter((a) => a.data_source === "faa");
  const foreflightAircraft = aircraft.filter((a) => a.data_source === "foreflight");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-truehour-card border border-truehour-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Import Complete</h2>
              <p className="text-sm text-slate-400">ForeFlight data successfully imported</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-truehour-darker rounded-lg p-4 border border-truehour-border">
              <div className="text-slate-400 text-sm mb-1">Flights Imported</div>
              <div className="text-3xl font-bold text-emerald-400">{flightsImported}</div>
            </div>
            <div className="bg-truehour-darker rounded-lg p-4 border border-truehour-border">
              <div className="text-slate-400 text-sm mb-1">Aircraft Added</div>
              <div className="text-3xl font-bold text-blue-400">{aircraft.length}</div>
            </div>
            <div className="bg-truehour-darker rounded-lg p-4 border border-truehour-border">
              <div className="text-slate-400 text-sm mb-1">Skipped/Duplicates</div>
              <div className="text-3xl font-bold text-slate-500">{flightsSkipped}</div>
            </div>
          </div>

          {/* FAA Lookup Summary */}
          {aircraft.length > 0 && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-3">
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
                <div className="text-sm text-blue-300">
                  <div className="font-medium mb-2">FAA Registry Lookup Results</div>
                  <div className="space-y-1 text-xs">
                    <div>
                      ✓ <span className="font-medium">{faaAircraft.length}</span> aircraft verified from FAA registry
                    </div>
                    {foreflightAircraft.length > 0 && (
                      <div>
                        • <span className="font-medium">{foreflightAircraft.length}</span> aircraft from ForeFlight data
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Aircraft List */}
          {aircraft.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Aircraft Added</h3>
              <div className="space-y-3">
                {aircraft.map((ac) => (
                  <div
                    key={ac.id}
                    className="bg-truehour-darker rounded-lg p-4 border border-truehour-border hover:border-truehour-blue/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-bold text-truehour-blue">{ac.tail_number}</span>
                          <SourceBadge source={ac.data_source} size="sm" />
                        </div>
                        <div className="text-white font-medium">
                          {ac.year && <span className="text-slate-400">{ac.year} </span>}
                          {ac.make} {ac.model}
                        </div>
                      </div>
                      {ac.total_time !== undefined && (
                        <div className="text-right">
                          <div className="text-slate-400 text-xs mb-1">Hours Logged</div>
                          <div className="text-lg font-semibold text-emerald-400">{ac.total_time.toFixed(1)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors Section */}
          {errors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Import Warnings</h3>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="space-y-2">
                  {errors.slice(0, 10).map((error, idx) => (
                    <div key={idx} className="text-sm text-amber-300 flex gap-2">
                      <span className="text-amber-500">⚠</span>
                      <span>{error}</span>
                    </div>
                  ))}
                  {errors.length > 10 && (
                    <div className="text-xs text-amber-400 mt-2">... and {errors.length - 10} more warnings</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-truehour-border bg-truehour-darker">
          <div className="text-sm text-slate-400">All data has been saved to the database</div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
