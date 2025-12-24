import { useState, useEffect } from "react";
import { HoursCards } from "./HoursCards";
import { CertificationProgressDetailed } from "./CertificationProgressDetailed";
import { BudgetBreakdown } from "./BudgetBreakdown";
import { Timeline } from "./Timeline";
import { useUserStore } from "../../store/userStore";

type CertificationType = "private" | "ir" | "cpl" | "cfi";

export function SummaryView() {
  const { settings, updateSettings } = useUserStore();
  const [selectedCert, setSelectedCert] = useState<CertificationType>("ir");

  useEffect(() => {
    if (settings?.target_certification) {
      setSelectedCert(settings.target_certification as CertificationType);
    }
  }, [settings?.target_certification]);

  const handleCertChange = async (cert: CertificationType) => {
    setSelectedCert(cert);
    await updateSettings({ target_certification: cert });
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Selector */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Flight Hours & Requirements</h2>
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
      </div>

      {/* Hours Cards - Full Width Row */}
      <section>
        <HoursCards />
      </section>

      {/* Certification Requirements - Full Width */}
      <section>
        <CertificationProgressDetailed selectedCert={selectedCert} />
      </section>

      {/* Budget & Timeline - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetBreakdown />
        <Timeline selectedCert={selectedCert} />
      </div>
    </div>
  );
}
