// Flight Detail Modal
// Displays all stored data for a selected flight (read-only for now)

import type { Flight } from '../../types/api';

interface FlightDetailModalProps {
  flight: Flight | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FlightDetailModal({ flight, isOpen, onClose }: FlightDetailModalProps) {
  if (!isOpen || !flight) return null;

  const formatHours = (hours?: number | null) => {
    if (!hours || isNaN(Number(hours))) return '0.0';
    return Number(hours).toFixed(1);
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount || isNaN(Number(amount))) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-truehour-darker border border-truehour-border rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border">
          <div>
            <h2 className="text-2xl font-bold text-white">Flight Details</h2>
            <p className="text-slate-400 text-sm mt-1">{formatDate(flight.date)}</p>
          </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-slate-400 text-sm mb-1">Aircraft</div>
                <div className="text-white font-mono">{flight.tail_number || (flight.is_simulator_session ? 'Simulator' : '-')}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Date</div>
                <div className="text-white">{new Date(flight.date).toLocaleDateString('en-US')}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Departure</div>
                <div className="text-white font-mono">{flight.departure_airport || '-'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Arrival</div>
                <div className="text-white font-mono">{flight.arrival_airport || '-'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-slate-400 text-sm mb-1">Route</div>
                <div className="text-white font-mono">{flight.route || '-'}</div>
              </div>
            </div>
          </div>

          {/* Times */}
          {(flight.time_out || flight.time_off || flight.time_on || flight.time_in) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Block & Flight Times</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-slate-400 text-sm mb-1">Out</div>
                  <div className="text-white font-mono">{flight.time_out || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">Off</div>
                  <div className="text-white font-mono">{flight.time_off || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">On</div>
                  <div className="text-white font-mono">{flight.time_on || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">In</div>
                  <div className="text-white font-mono">{flight.time_in || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Flight Hours */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Flight Hours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-slate-400 text-sm mb-1">Total Time</div>
                <div className="text-white font-semibold">{formatHours(flight.total_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">PIC</div>
                <div className="text-white">{formatHours(flight.pic_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">SIC</div>
                <div className="text-white">{formatHours(flight.sic_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Solo</div>
                <div className="text-white">{formatHours(flight.solo_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Night</div>
                <div className="text-white">{formatHours(flight.night_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Cross Country</div>
                <div className="text-white">{formatHours(flight.cross_country_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Actual Instrument</div>
                <div className="text-white">{formatHours(flight.actual_instrument_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Simulated Instrument</div>
                <div className="text-white">{formatHours(flight.simulated_instrument_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Simulator</div>
                <div className="text-white">{formatHours(flight.simulated_flight_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Dual Given</div>
                <div className="text-white">{formatHours(flight.dual_given_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Dual Received</div>
                <div className="text-white">{formatHours(flight.dual_received_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Ground Training</div>
                <div className="text-white">{formatHours(flight.ground_training_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Complex</div>
                <div className="text-white">{formatHours(flight.complex_time)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">High Performance</div>
                <div className="text-white">{formatHours(flight.high_performance_time)}</div>
              </div>
            </div>
          </div>

          {/* Landings & Operations */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Landings & Operations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-slate-400 text-sm mb-1">Day Takeoffs</div>
                <div className="text-white">{flight.day_takeoffs || 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Day Landings (Full Stop)</div>
                <div className="text-white">{flight.day_landings_full_stop || 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Night Takeoffs</div>
                <div className="text-white">{flight.night_takeoffs || 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Night Landings (Full Stop)</div>
                <div className="text-white">{flight.night_landings_full_stop || 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">All Landings</div>
                <div className="text-white">{flight.all_landings || 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Holds</div>
                <div className="text-white">{flight.holds || 0}</div>
              </div>
            </div>
          </div>

          {/* Approaches */}
          {flight.approaches && Object.keys(flight.approaches).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Approaches</h3>
              <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
                <pre className="text-white text-sm font-mono">{JSON.stringify(flight.approaches, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* Hobbs & Tach */}
          {(flight.hobbs_start || flight.hobbs_end || flight.tach_start || flight.tach_end) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Hobbs & Tach</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-slate-400 text-sm mb-1">Hobbs Start</div>
                  <div className="text-white">{flight.hobbs_start || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">Hobbs End</div>
                  <div className="text-white">{flight.hobbs_end || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">Tach Start</div>
                  <div className="text-white">{flight.tach_start || '-'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-1">Tach End</div>
                  <div className="text-white">{flight.tach_end || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Costs */}
          {(flight.fuel_cost || flight.landing_fees || flight.instructor_cost || flight.rental_cost || flight.other_costs) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Costs</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {flight.fuel_gallons && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Fuel (gallons)</div>
                    <div className="text-white">{Number(flight.fuel_gallons).toFixed(1)}</div>
                  </div>
                )}
                {flight.fuel_cost && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Fuel Cost</div>
                    <div className="text-white">{formatCurrency(flight.fuel_cost)}</div>
                  </div>
                )}
                {flight.landing_fees && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Landing Fees</div>
                    <div className="text-white">{formatCurrency(flight.landing_fees)}</div>
                  </div>
                )}
                {flight.instructor_cost && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Instructor Cost</div>
                    <div className="text-white">{formatCurrency(flight.instructor_cost)}</div>
                  </div>
                )}
                {flight.rental_cost && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Rental Cost</div>
                    <div className="text-white">{formatCurrency(flight.rental_cost)}</div>
                  </div>
                )}
                {flight.other_costs && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Other Costs</div>
                    <div className="text-white">{formatCurrency(flight.other_costs)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Special Flags */}
          {(flight.is_flight_review || flight.is_ipc || flight.is_checkride || flight.is_simulator_session) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Special Designations</h3>
              <div className="flex flex-wrap gap-2">
                {flight.is_flight_review && (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm">
                    Flight Review
                  </span>
                )}
                {flight.is_ipc && (
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-sm">
                    IPC
                  </span>
                )}
                {flight.is_checkride && (
                  <span className="px-3 py-1 bg-pink-500/10 text-pink-400 border border-pink-500/20 rounded-full text-sm">
                    Checkride
                  </span>
                )}
                {flight.is_simulator_session && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-sm">
                    Simulator Session
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Comments */}
          {(flight.instructor_name || flight.instructor_comments || flight.pilot_comments) && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Notes & Comments</h3>
              <div className="space-y-4">
                {flight.instructor_name && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Instructor</div>
                    <div className="text-white">{flight.instructor_name}</div>
                  </div>
                )}
                {flight.instructor_comments && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Instructor Comments</div>
                    <div className="bg-truehour-card border border-truehour-border rounded-lg p-4 text-white text-sm">
                      {flight.instructor_comments}
                    </div>
                  </div>
                )}
                {flight.pilot_comments && (
                  <div>
                    <div className="text-slate-400 text-sm mb-1">Pilot Comments</div>
                    <div className="bg-truehour-card border border-truehour-border rounded-lg p-4 text-white text-sm">
                      {flight.pilot_comments}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-truehour-border gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-truehour-card border border-truehour-border text-white rounded-lg hover:bg-truehour-darker transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
