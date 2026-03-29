import { useUserStore } from "../../store/userStore";

interface HourCard {
  label: string;
  value: number;
  color: string;
}

export function HoursCards() {
  const { currentHours, isLoading } = useUserStore();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-truehour-card border border-truehour-border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-truehour-darker rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-truehour-darker rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!currentHours) {
    return (
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <p className="text-slate-400">No hours data available. Import your ForeFlight logbook to get started.</p>
      </div>
    );
  }

  const cards: HourCard[] = [
    { label: "Total Hours", value: Number(currentHours.total) || 0, color: "text-truehour-blue" },
    { label: "PIC", value: Number(currentHours.pic) || 0, color: "text-truehour-green" },
    { label: "Cross Country", value: Number(currentHours.cross_country) || 0, color: "text-truehour-orange" },
    { label: "Instrument", value: Number(currentHours.instrument_total) || 0, color: "text-purple-400" },
    { label: "Night", value: Number(currentHours.night) || 0, color: "text-indigo-400" },
    { label: "Simulator", value: Number(currentHours.simulator_time) || 0, color: "text-cyan-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-truehour-card border border-truehour-border rounded-lg p-4 hover:border-truehour-blue transition-colors"
        >
          <p className="text-slate-400 text-xs font-medium mb-2">{card.label}</p>
          <p className={`text-3xl font-bold ${card.color}`}>{card.value.toFixed(1)}</p>
          <p className="text-slate-500 text-xs mt-1">hours</p>
        </div>
      ))}
    </div>
  );
}
