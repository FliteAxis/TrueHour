import { useEffect, useState } from 'react';
import type { Flight } from '../../types/api';
import * as api from '../../services/api';

export function RecentFlights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFlights();
  }, []);

  const loadFlights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await api.loadUserData();
      // Get last 10 flights, sorted by date descending
      const recentFlights = userData.flights
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
      setFlights(recentFlights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flights');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Flights</h3>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-truehour-darker rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-truehour-card border border-truehour-red rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Flights</h3>
        <p className="text-truehour-red">{error}</p>
        <button
          onClick={loadFlights}
          className="mt-4 px-4 py-2 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Flights</h3>
        <p className="text-slate-400">No flights found. Import your ForeFlight logbook to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">Recent Flights</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-truehour-border">
              <th className="text-left py-3 px-2 text-slate-400 font-medium text-sm">Date</th>
              <th className="text-left py-3 px-2 text-slate-400 font-medium text-sm">Route</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium text-sm">Total</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium text-sm">PIC</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium text-sm">XC</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium text-sm">Night</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((flight, index) => (
              <tr
                key={flight.id || index}
                className="border-b border-truehour-border hover:bg-truehour-darker transition-colors"
              >
                <td className="py-3 px-2 text-slate-300 text-sm">
                  {new Date(flight.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="py-3 px-2 text-slate-300 text-sm">
                  {flight.departure_airport && flight.arrival_airport ? (
                    <span>
                      {flight.departure_airport} → {flight.arrival_airport}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="py-3 px-2 text-right text-truehour-blue font-medium text-sm">
                  {flight.total_time ? Number(flight.total_time).toFixed(1) : '0.0'}
                </td>
                <td className="py-3 px-2 text-right text-slate-300 text-sm">
                  {flight.pic_time ? Number(flight.pic_time).toFixed(1) : '—'}
                </td>
                <td className="py-3 px-2 text-right text-slate-300 text-sm">
                  {flight.cross_country_time ? Number(flight.cross_country_time).toFixed(1) : '—'}
                </td>
                <td className="py-3 px-2 text-right text-slate-300 text-sm">
                  {flight.night_time ? Number(flight.night_time).toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-center">
        <button className="text-truehour-blue hover:text-blue-400 text-sm font-medium transition-colors">
          View All Flights →
        </button>
      </div>
    </div>
  );
}
