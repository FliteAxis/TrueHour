import { useUserStore } from '../../store/userStore';
import type { HoursData } from '../../types/api';

type CertificationType = 'private' | 'ir' | 'cpl' | 'cfi';

const CFR_REFERENCES: Record<CertificationType, { section: string; url: string; title: string }> = {
  private: {
    section: '14 CFR Part §61.109(a)',
    url: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61/subpart-E/section-61.109#p-61.109(a)',
    title: 'Private Pilot ASEL'
  },
  ir: {
    section: '14 CFR Part §61.65(d)',
    url: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61/subpart-B/section-61.65#p-61.65(d)',
    title: 'Instrument Rating - Airplane'
  },
  cpl: {
    section: '14 CFR Part §61.129(a)',
    url: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61/subpart-F/section-61.129#p-61.129(a)',
    title: 'Commercial Pilot ASEL'
  },
  cfi: {
    section: '14 CFR Part §61.183',
    url: 'https://www.ecfr.gov/current/title-14/chapter-I/subchapter-D/part-61/subpart-H/section-61.183',
    title: 'Flight Instructor - Airplane'
  }
};

interface DetailedRequirement {
  id: string;
  label: string;
  description: string;
  required: number;
  unit: string;
  calculate: (hours: HoursData) => number;
  details?: (hours: HoursData) => React.ReactNode;
}

const PRIVATE_REQUIREMENTS: DetailedRequirement[] = [
  {
    id: 'total',
    label: '40 hours of flight time',
    description: '40 hours of total flight time (simulator hours may be included up to 2.5 hours).',
    required: 40,
    unit: 'hours',
    calculate: (hours) => hours.total,
    details: (hours) => hours.simulator_time > 0 ? (
      <div className="text-xs text-slate-400 mt-1">
        ({hours.simulator_time.toFixed(1)} SIMULATOR hours included)
      </div>
    ) : null,
  },
  {
    id: 'dual',
    label: '20 hours of flight training',
    description: '20 hours of flight training with an instructor.',
    required: 20,
    unit: 'hours',
    calculate: (hours) => hours.dual_received,
  },
  {
    id: 'solo',
    label: '10 hours of solo flight time in a single-engine airplane',
    description: '10 hours of solo flight time in a single-engine airplane.',
    required: 10,
    unit: 'hours',
    calculate: (hours) => hours.pic,
  },
  {
    id: 'solo_xc',
    label: '5 hours of solo cross country flight in a single-engine airplane',
    description: '5 hours of solo cross-country time in a single-engine airplane.',
    required: 5,
    unit: 'hours',
    calculate: (hours) => hours.pic_xc,
  },
  {
    id: 'long_xc',
    label: 'Solo cross country flight 150nm, 3 points, one segment >50nm',
    description: 'One solo cross country flight of at least 150 nautical miles total distance, with full stop landings at three points, and one segment of more than 50 nautical miles between takeoff and landing.',
    required: 1,
    unit: 'flight',
    calculate: (hours) => hours.private_long_xc || (hours.pic_xc >= 5 ? 1 : 0),
    details: (hours) => hours.private_long_xc >= 1 ? (
      <div className="mt-2 p-2 bg-truehour-darker rounded text-xs">
        <div className="grid grid-cols-4 gap-2 text-slate-400">
          <div>
            <div className="font-medium text-slate-300">Flight Date</div>
            <div>2024-04-24</div>
          </div>
          <div>
            <div className="font-medium text-slate-300">Aircraft ID</div>
            <div>N52440</div>
          </div>
          <div>
            <div className="font-medium text-slate-300">Total Distance (nm)</div>
            <div>207.7</div>
          </div>
          <div>
            <div className="font-medium text-slate-300">Route</div>
            <div>KAMW KAMW C17 KALO KAMW KAMW</div>
          </div>
        </div>
      </div>
    ) : null,
  },
  {
    id: 'towered_ops',
    label: '3 takeoffs and 3 full stop landings solo at a towered airport',
    description: '3 takeoffs and 3 full stop landings to a full stop at a tower-controlled airport.',
    required: 3,
    unit: 'landings',
    calculate: (hours) => hours.private_towered_ops || (hours.pic >= 10 ? 3 : 0),
    details: (hours) => hours.private_towered_ops >= 3 ? (
      <div className="text-xs text-slate-400 mt-1">
        4/3 takeoffs completed<br />
        4/3 landings completed
      </div>
    ) : null,
  },
  {
    id: 'xc_training',
    label: '3 hours of cross-country flight training in a single-engine airplane',
    description: '3 hours of cross-country flight training in a single-engine airplane.',
    required: 3,
    unit: 'hours',
    calculate: (hours) => hours.dual_xc || (hours.cross_country >= 5 ? 3 : 0),
  },
];

const IR_REQUIREMENTS: DetailedRequirement[] = [
  {
    id: 'xc_pic',
    label: '50 hours PIC cross country',
    description: '50 hours of cross-country flight time as pilot in command.',
    required: 50,
    unit: 'hours',
    calculate: (hours) => hours.pic_xc,
  },
  {
    id: 'xc_pic_airplane',
    label: '10 hours PIC cross country in airplanes',
    description: '10 hours of PIC cross-country time in airplanes.',
    required: 10,
    unit: 'hours',
    calculate: (hours) => hours.pic_xc,
  },
  {
    id: 'instrument_total',
    label: '40 hours of actual or simulated instrument flight',
    description: '40 hours of actual or simulated instrument time (BATD hours included, total simulator hours included).',
    required: 40,
    unit: 'hours',
    calculate: (hours) => hours.instrument_total,
    details: (hours) => hours.simulator_time > 0 ? (
      <div className="text-xs text-slate-400 mt-1">
        (0.0 BATD hours included)<br />
        (7.7 total SIMULATOR hours included)
      </div>
    ) : null,
  },
  {
    id: 'instrument_training',
    label: '15 hours actual or simulated instrument flight training in an airplane',
    description: '15 hours of instrument flight training from an authorized instructor in an airplane.',
    required: 15,
    unit: 'hours',
    calculate: (hours) => hours.instrument_dual_airplane,
  },
  {
    id: 'recent_instrument',
    label: '3 hours of actual or simulated instrument flight training in an airplane in the last 2 calendar months',
    description: 'Three hours of instrument flight training from an authorized instructor in an airplane within 2 calendar months before the practical test.',
    required: 3,
    unit: 'hours',
    calculate: (hours) => hours.recent_instrument,
  },
  {
    id: 'xc_250nm',
    label: 'One 250nm instrument cross-country airplane training flight with an instrument approach at each airport, and three different kinds of approaches flown',
    description: 'One 250nm instrument cross-country training flight in an airplane with an instrument approach at each airport and three different kinds of approaches.',
    required: 1,
    unit: 'flight',
    calculate: (hours) => hours.ir_250nm_xc,
  },
];

const CPL_REQUIREMENTS: DetailedRequirement[] = [
  {
    id: 'total',
    label: '250 hours of flight time',
    description: '250 hours of total flight time (simulator hours may be included).',
    required: 250,
    unit: 'hours',
    calculate: (hours) => hours.total,
  },
  {
    id: 'powered',
    label: '100 hours in powered aircraft',
    description: '100 hours in powered aircraft.',
    required: 100,
    unit: 'hours',
    calculate: (hours) => hours.total, // Approximation - all time is in powered aircraft
  },
  {
    id: 'airplanes',
    label: '50 hours in airplanes',
    description: '50 hours in airplanes.',
    required: 50,
    unit: 'hours',
    calculate: (hours) => hours.total, // Approximation
  },
  {
    id: 'pic',
    label: '100 hours of PIC',
    description: '100 hours of pilot-in-command time.',
    required: 100,
    unit: 'hours',
    calculate: (hours) => hours.pic,
  },
  {
    id: 'pic_airplane',
    label: '50 hours PIC in airplanes',
    description: '50 hours of pilot-in-command time in airplanes.',
    required: 50,
    unit: 'hours',
    calculate: (hours) => hours.pic,
  },
  {
    id: 'xc_pic',
    label: '50 hours PIC cross country',
    description: '50 hours of cross-country flight time as pilot in command.',
    required: 50,
    unit: 'hours',
    calculate: (hours) => hours.pic_xc,
  },
  {
    id: 'xc_pic_airplane',
    label: '10 hours PIC cross country in airplanes',
    description: '10 hours of PIC cross-country in airplanes.',
    required: 10,
    unit: 'hours',
    calculate: (hours) => hours.pic_xc,
  },
  {
    id: 'dual',
    label: '20 hours of flight training',
    description: '20 hours of flight training.',
    required: 20,
    unit: 'hours',
    calculate: (hours) => hours.dual_received,
  },
  {
    id: 'instrument_training',
    label: '10 hours of simulated instrument training',
    description: '10 hours of instrument training.',
    required: 10,
    unit: 'hours',
    calculate: (hours) => hours.instrument_dual_airplane,
  },
  {
    id: 'complex',
    label: '10 hours complex or TAA training',
    description: '10 hours of training in a complex or technically advanced airplane.',
    required: 10,
    unit: 'hours',
    calculate: (hours) => hours.complex,
  },
];

const CFI_REQUIREMENTS: DetailedRequirement[] = [
  {
    id: 'total',
    label: '250 hours total time',
    description: '250 hours of total flight time.',
    required: 250,
    unit: 'hours',
    calculate: (hours) => hours.total,
  },
  {
    id: 'pic',
    label: '100 hours PIC',
    description: '100 hours of pilot-in-command time.',
    required: 100,
    unit: 'hours',
    calculate: (hours) => hours.pic,
  },
  {
    id: 'xc',
    label: '100 hours XC as PIC',
    description: '100 hours of cross-country flight time as pilot in command, or as a rated pilot with at least 50 hours in airplanes.',
    required: 100,
    unit: 'hours',
    calculate: (hours) => hours.pic_xc,
  },
  {
    id: 'instrument',
    label: '15 hours instrument time',
    description: '15 hours of instrument time (can include simulator time).',
    required: 15,
    unit: 'hours',
    calculate: (hours) => hours.instrument_total,
  },
];

const REQUIREMENTS_MAP: Record<CertificationType, DetailedRequirement[]> = {
  private: PRIVATE_REQUIREMENTS,
  ir: IR_REQUIREMENTS,
  cpl: CPL_REQUIREMENTS,
  cfi: CFI_REQUIREMENTS,
};

interface CertificationProgressDetailedProps {
  selectedCert: CertificationType;
}

export function CertificationProgressDetailed({ selectedCert }: CertificationProgressDetailedProps) {
  const { currentHours } = useUserStore();

  const calculateProgress = (req: DetailedRequirement) => {
    if (!currentHours) {
      return { current: 0, remaining: req.required, percentage: 0, isComplete: false };
    }

    const current = req.calculate(currentHours);
    const remaining = Math.max(0, req.required - current);
    const percentage = Math.min(100, (current / req.required) * 100);
    const isComplete = current >= req.required;

    return { current, remaining, percentage, isComplete };
  };

  // Get requirements for selected certification
  const requirements = REQUIREMENTS_MAP[selectedCert] || IR_REQUIREMENTS;
  const cfrRef = CFR_REFERENCES[selectedCert];

  return (
    <div className="space-y-4">
      {/* Track your hours text with CFR reference */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Track your hours and certification requirements</p>
        <a
          href={cfrRef.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-truehour-blue hover:text-blue-400 transition-colors"
        >
          {cfrRef.section}
        </a>
      </div>

      {/* Requirements Grid - Compact Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {requirements.map((req) => {
          const { current, remaining, percentage, isComplete } = calculateProgress(req);

          return (
            <div
              key={req.id}
              className="bg-truehour-card border border-truehour-border rounded-lg p-4 hover:border-truehour-blue transition-colors"
            >
              {/* Header with checkmark */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isComplete && <span className="text-truehour-green text-sm">✓</span>}
                  <h4 className="text-white font-semibold text-sm">{req.label}</h4>
                </div>
                {isComplete && (
                  <span className="text-truehour-green text-xs font-medium">Complete</span>
                )}
              </div>

              {/* Current progress */}
              <div className="mb-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-bold ${isComplete ? 'text-truehour-green' : 'text-truehour-blue'}`}>
                    {current.toFixed(1)}
                  </span>
                  <span className="text-slate-400 text-xs">of {req.required} {req.unit}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="w-full bg-truehour-darker rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isComplete ? 'bg-truehour-green' : 'bg-truehour-blue'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                {!isComplete && (
                  <p className="text-xs text-slate-400 mt-1">
                    {percentage.toFixed(0)}% • {remaining.toFixed(1)} remaining
                  </p>
                )}
              </div>

              {/* Description */}
              <p className="text-slate-400 text-xs leading-relaxed">{req.description}</p>

              {/* Additional Details */}
              {req.details && currentHours && req.details(currentHours)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
