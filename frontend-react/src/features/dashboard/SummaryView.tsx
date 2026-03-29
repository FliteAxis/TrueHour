import { HoursCards } from "./HoursCards";
import { CertificationProgressDetailed } from "./CertificationProgressDetailed";
import { BudgetBreakdown } from "./BudgetBreakdown";
import { Timeline } from "./Timeline";
import { useUserStore } from "../../store/userStore";

type CertificationType = "private" | "ir" | "cpl" | "cfi";

export function SummaryView() {
  const { settings } = useUserStore();
  const selectedCert = (settings?.target_certification?.toLowerCase() || "ir") as CertificationType;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white">Flight Hours & Requirements</h2>
        {!settings?.target_certification && (
          <p className="text-slate-400 text-sm mt-2">
            Set your target certification in Settings to see customized progress tracking
          </p>
        )}
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
