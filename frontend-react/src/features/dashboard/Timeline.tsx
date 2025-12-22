import { useUserStore } from '../../store/userStore';
import type { HoursData } from '../../types/api';

type CertificationType = 'private' | 'ir' | 'cpl' | 'cfi';

interface TimelineProps {
  selectedCert: CertificationType;
}

// Certification requirements mapping
const CERT_REQUIREMENTS: Record<CertificationType, {
  name: string;
  totalHoursRequired: number;
  keyRequirement: {
    label: string;
    field: keyof HoursData;
    required: number;
  };
}> = {
  private: {
    name: 'Private Pilot',
    totalHoursRequired: 40,
    keyRequirement: {
      label: 'total time',
      field: 'total',
      required: 40,
    },
  },
  ir: {
    name: 'Instrument Rating',
    totalHoursRequired: 40,
    keyRequirement: {
      label: 'instrument time',
      field: 'instrument_total',
      required: 40,
    },
  },
  cpl: {
    name: 'Commercial Pilot',
    totalHoursRequired: 250,
    keyRequirement: {
      label: 'total time',
      field: 'total',
      required: 250,
    },
  },
  cfi: {
    name: 'Flight Instructor',
    totalHoursRequired: 250,
    keyRequirement: {
      label: 'total time',
      field: 'total',
      required: 250,
    },
  },
};

export function Timeline({ selectedCert }: TimelineProps) {
  const { currentHours } = useUserStore();

  const certInfo = CERT_REQUIREMENTS[selectedCert];

  // Calculate estimated time to completion based on recent flying rate
  const calculateEstimate = () => {
    if (!currentHours) {
      return { months: 0, budget: 0, remainingHours: 0, progressPercent: 0 };
    }

    const currentValue = currentHours[certInfo.keyRequirement.field] || 0;
    const requiredValue = certInfo.keyRequirement.required;
    const remainingHours = Math.max(0, requiredValue - currentValue);
    const progressPercent = Math.min(100, Math.round((currentValue / requiredValue) * 100));

    // Assume average flying rate of 5 hours/month and $200/hour
    const avgHoursPerMonth = 5;
    const avgCostPerHour = 200;

    const months = remainingHours > 0 ? remainingHours / avgHoursPerMonth : 0;
    const budget = remainingHours * avgCostPerHour;

    return {
      months: Math.ceil(months),
      budget,
      remainingHours,
      progressPercent,
      currentValue,
    };
  };

  const { months, budget, remainingHours, progressPercent, currentValue } = calculateEstimate();

  return (
    <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-6">Timeline</h3>

      <div className="space-y-8">
        {/* Time to Completion */}
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-2">Est. Time to Completion</p>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-slate-500 text-3xl">≈</span>
            <span className="text-truehour-blue text-5xl font-bold">{months}</span>
            <span className="text-slate-300 text-2xl">Months</span>
          </div>
          <p className="text-slate-500 text-xs">
            Based on current flying rate and requirements
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-truehour-border"></div>

        {/* Monthly Budget */}
        <div className="text-center">
          <p className="text-slate-400 text-sm mb-2">Est. Monthly Budget</p>
          <div className="text-truehour-green text-4xl font-bold mb-1">
            ${budget > 0 ? (budget / months).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <p className="text-slate-500 text-xs">
            Estimated cost to complete certification
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-truehour-border"></div>

        {/* Progress Indicator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Overall Progress</span>
            <span className="text-slate-300 text-sm font-semibold">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-truehour-darker rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-truehour-blue to-truehour-green transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>

        {/* Milestone Info */}
        <div className="bg-truehour-darker rounded-lg p-4">
          <h4 className="text-white font-semibold text-sm mb-2">Next Milestone</h4>
          <p className="text-slate-400 text-xs mb-2">
            {remainingHours > 0 ? (
              <>Complete {certInfo.keyRequirement.required} hours of {certInfo.keyRequirement.label} to meet {certInfo.name} requirements</>
            ) : (
              <>You've met the {certInfo.keyRequirement.label} requirement for {certInfo.name}!</>
            )}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Status:</span>
            <span className={`font-medium ${remainingHours > 0 ? 'text-truehour-orange' : 'text-truehour-green'}`}>
              {remainingHours > 0 ? 'In Progress' : 'Complete ✓'}
            </span>
          </div>
          {remainingHours > 0 && (
            <div className="mt-2 pt-2 border-t border-truehour-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Current:</span>
                <span className="text-slate-300 font-medium">{currentValue?.toFixed(1) ?? '0.0'} hrs</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Remaining:</span>
                <span className="text-truehour-orange font-medium">{remainingHours.toFixed(1)} hrs</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
