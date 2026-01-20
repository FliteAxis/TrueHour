import { useState } from "react";
import { useUserStore } from "../../store/userStore";
import type { HoursData } from "../../types/api";

// Inline all certification types and data to avoid module import issues
type CertificationType = "private" | "ir" | "cpl" | "cfi";

interface CertificationRequirement {
  label: string;
  required: number;
  unit: string;
  key: keyof HoursData | "total_xc_pic";
}

const CERTIFICATION_REQUIREMENTS: Record<CertificationType, CertificationRequirement[]> = {
  private: [
    { label: "Total Time", required: 40, unit: "hrs", key: "total" },
    { label: "PIC", required: 10, unit: "hrs", key: "pic" },
    { label: "Cross-Country", required: 5, unit: "hrs", key: "cross_country" },
    { label: "Night", required: 3, unit: "hrs", key: "night" },
  ],
  ir: [
    { label: "Total Time", required: 50, unit: "hrs", key: "total" },
    { label: "Cross-Country PIC", required: 50, unit: "hrs", key: "total_xc_pic" },
    { label: "Instrument Time", required: 40, unit: "hrs", key: "instrument_total" },
  ],
  cpl: [
    { label: "Total Time", required: 250, unit: "hrs", key: "total" },
    { label: "PIC", required: 100, unit: "hrs", key: "pic" },
    { label: "Cross-Country PIC", required: 50, unit: "hrs", key: "total_xc_pic" },
    { label: "Night", required: 5, unit: "hrs", key: "night" },
    { label: "Instrument", required: 10, unit: "hrs", key: "instrument_total" },
  ],
  cfi: [
    { label: "Total Time", required: 250, unit: "hrs", key: "total" },
    { label: "PIC", required: 100, unit: "hrs", key: "pic" },
  ],
};

export function CertificationProgress() {
  const { settings, currentHours, updateSettings } = useUserStore();
  const [selectedCert, setSelectedCert] = useState<CertificationType | "">(() => {
    // Initialize from settings on mount
    return (settings?.target_certification as CertificationType) || "";
  });

  const handleCertChange = async (cert: CertificationType) => {
    setSelectedCert(cert);
    await updateSettings({ target_certification: cert });
  };

  const calculateProgress = (
    req: CertificationRequirement
  ): { current: number; remaining: number; percentage: number } => {
    if (!currentHours) {
      return { current: 0, remaining: req.required, percentage: 0 };
    }

    let current = 0;

    // Special case for total_xc_pic (cross country PIC)
    if (req.key === "total_xc_pic") {
      // For now, use cross_country as approximation
      // TODO: Calculate actual XC PIC from flights table
      current = Math.min(currentHours.cross_country, currentHours.pic);
    } else {
      const value = currentHours[req.key];
      current = typeof value === "number" ? value : 0;
    }

    const remaining = Math.max(0, req.required - current);
    const percentage = Math.min(100, (current / req.required) * 100);

    return { current, remaining, percentage };
  };

  if (!selectedCert) {
    return (
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Certification Progress</h3>
        <p className="text-slate-400 mb-4">Select a certification to track your progress:</p>
        <select
          value=""
          onChange={(e) => handleCertChange(e.target.value as CertificationType)}
          className="w-full bg-truehour-darker border border-truehour-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-truehour-blue"
        >
          <option value="">Select Certification</option>
          <option value="private">Private Pilot</option>
          <option value="ir">Instrument Rating</option>
          <option value="cpl">Commercial Pilot</option>
          <option value="cfi">Certified Flight Instructor</option>
        </select>
      </div>
    );
  }

  const requirements = CERTIFICATION_REQUIREMENTS[selectedCert];
  const certLabels: Record<CertificationType, string> = {
    private: "Private Pilot",
    ir: "Instrument Rating",
    cpl: "Commercial Pilot",
    cfi: "Certified Flight Instructor",
  };

  return (
    <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">Certification Progress</h3>
        <select
          value={selectedCert}
          onChange={(e) => handleCertChange(e.target.value as CertificationType)}
          className="bg-truehour-darker border border-truehour-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-truehour-blue"
        >
          <option value="private">Private Pilot</option>
          <option value="ir">Instrument Rating</option>
          <option value="cpl">Commercial Pilot</option>
          <option value="cfi">Certified Flight Instructor</option>
        </select>
      </div>

      <p className="text-slate-400 mb-6">
        Progress toward <span className="text-truehour-blue font-semibold">{certLabels[selectedCert]}</span>
      </p>

      <div className="space-y-4">
        {requirements.map((req) => {
          const { current, remaining, percentage } = calculateProgress(req);
          const isComplete = remaining === 0;

          return (
            <div key={req.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">{req.label}</span>
                {isComplete ? (
                  <span className="text-truehour-green font-semibold">Complete! ✓</span>
                ) : (
                  <span className="text-slate-400 text-sm">
                    {current.toFixed(1)} / {req.required} {req.unit}
                    <span className="text-truehour-orange ml-2">({remaining.toFixed(1)} remaining)</span>
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-truehour-darker rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isComplete ? "bg-truehour-green" : "bg-truehour-blue"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
