// TrueHour Flights View
// Flight logbook with summary statistics and flight list

import { useEffect, useState } from 'react';
import { getFlights, getFlightSummary } from '../../services/api';
import type { Flight, FlightSummary } from '../../types/api';
import { FlightDetailModal } from './FlightDetailModal';

export function FlightsView() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [summary, setSummary] = useState<FlightSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMoreFlights, setHasMoreFlights] = useState<boolean>(false);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [rowsPerPage, currentPage]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * rowsPerPage;

      const [flightsData, summaryData] = await Promise.all([
        getFlights({ limit: rowsPerPage, offset }),
        getFlightSummary(),
      ]);

      setFlights(flightsData);
      setSummary(summaryData);

      // Check if there are more flights (if we got exactly the limit, there might be more)
      setHasMoreFlights(flightsData.length === rowsPerPage);
    } catch (err) {
      console.error('Failed to load flights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load flights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handleFlightClick = (flight: Flight) => {
    setSelectedFlight(flight);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedFlight(null);
  };

  const formatHours = (hours?: number | null) => {
    if (!hours || isNaN(Number(hours))) return '0.0';
    return Number(hours).toFixed(1);
  };

  const formatRoute = (flight: Flight): string => {
    const parts = [];
    if (flight.departure_airport) parts.push(flight.departure_airport);
    if (flight.route) {
      // Extract airports from route (K-prefixed 4-letter codes)
      const airports = flight.route.match(/K[A-Z]{3}/g) || [];
      parts.push(...airports);
    }
    if (flight.arrival_airport && flight.arrival_airport !== parts[parts.length - 1]) {
      parts.push(flight.arrival_airport);
    }
    return parts.join(' → ') || '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Flight Log</h1>
        <p className="text-slate-400 mt-1">
          Complete flight history and hours summary
        </p>
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
          <p className="text-slate-400 mt-4">Loading flight data...</p>
        </div>
      )}

      {/* Summary Cards */}
      {!isLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Total Hours */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Total Hours</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.total_hours)}</div>
          </div>

          {/* PIC Hours */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">PIC</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.pic_hours)}</div>
          </div>

          {/* Cross Country */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Cross Country</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.cross_country_hours)}</div>
          </div>

          {/* Night */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Night</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.night_hours)}</div>
          </div>

          {/* Instrument */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Instrument</div>
            <div className="text-2xl font-bold text-white">
              {formatHours(Number(summary.actual_instrument_hours || 0) + Number(summary.simulated_instrument_hours || 0))}
            </div>
          </div>

          {/* Dual Received */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Dual Received</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.dual_received_hours)}</div>
          </div>
        </div>
      )}

      {/* Additional Stats Row */}
      {!isLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* Total Flights */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Total Flights</div>
            <div className="text-2xl font-bold text-white">{summary.total_flights}</div>
          </div>

          {/* Landings */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Total Landings</div>
            <div className="text-2xl font-bold text-white">{summary.total_landings}</div>
          </div>

          {/* Night Landings */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Night Landings</div>
            <div className="text-2xl font-bold text-white">{summary.night_landings}</div>
          </div>

          {/* Simulator */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Simulator</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.simulator_hours)}</div>
          </div>

          {/* Complex */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">Complex</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.complex_hours)}</div>
          </div>

          {/* High Performance */}
          <div className="bg-truehour-card border border-truehour-border rounded-lg p-4">
            <div className="text-slate-400 text-sm mb-1">High Perf</div>
            <div className="text-2xl font-bold text-white">{formatHours(summary.high_performance_hours)}</div>
          </div>
        </div>
      )}

      {/* Flights Table */}
      {!isLoading && flights.length > 0 && (
        <div className="bg-truehour-card border border-truehour-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-truehour-border flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Flights</h3>
            <div className="flex items-center gap-2">
              <label htmlFor="rowsPerPage" className="text-sm text-slate-400">
                Show:
              </label>
              <select
                id="rowsPerPage"
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="bg-truehour-darker border border-truehour-border text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-truehour-blue"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-truehour-darker">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Aircraft
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    PIC
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    XC
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Night
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Inst
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Ldg
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-truehour-border">
                {flights.map((flight) => (
                  <tr
                    key={flight.id}
                    onClick={() => handleFlightClick(flight)}
                    className="hover:bg-truehour-darker transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {new Date(flight.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-mono text-white">
                        {flight.tail_number || (flight.is_simulator_session ? 'SIM' : '-')}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-300">
                        {formatRoute(flight)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-white">
                        {formatHours(flight.total_time)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-slate-300">
                        {formatHours(flight.pic_time)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-slate-300">
                        {formatHours(flight.cross_country_time)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-slate-300">
                        {formatHours(flight.night_time)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-slate-300">
                        {formatHours(
                          (flight.actual_instrument_time || 0) +
                          (flight.simulated_instrument_time || 0)
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm text-slate-300">
                        {flight.all_landings || 0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-truehour-border flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Showing {flights.length > 0 ? ((currentPage - 1) * rowsPerPage) + 1 : 0} - {(currentPage - 1) * rowsPerPage + flights.length} flights
              {summary && ` of ${summary.total_flights} total`}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-truehour-darker border border-truehour-border text-slate-300 rounded-lg hover:border-truehour-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-slate-400 px-3">
                Page {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!hasMoreFlights}
                className="px-4 py-2 bg-truehour-darker border border-truehour-border text-slate-300 rounded-lg hover:border-truehour-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && flights.length === 0 && (
        <div className="bg-truehour-card border border-truehour-border rounded-lg p-12">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white">No flights yet</h3>
            <p className="mt-1 text-sm text-slate-400">
              Import your ForeFlight logbook to see your flights here
            </p>
          </div>
        </div>
      )}

      {/* Flight Detail Modal */}
      <FlightDetailModal
        flight={selectedFlight}
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
      />
    </div>
  );
}
