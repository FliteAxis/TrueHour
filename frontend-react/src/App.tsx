import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUserStore } from "./store/userStore";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { SummaryView } from "./features/dashboard/SummaryView";
import { BudgetView } from "./features/budget/BudgetView";
import { ExpensesView } from "./features/expenses/ExpensesView";
import { FlightsView } from "./features/flights/FlightsView";
import { ReportsView } from "./features/reports/ReportsView";
import { SettingsView } from "./features/settings/SettingsView";
import { AircraftView } from "./features/aircraft/AircraftView";
import { AircraftRatesView } from "./features/aircraft/AircraftRatesView";
import OnboardingWizard from "./features/onboarding/OnboardingWizard";

function App() {
  const { settings, isLoading, error, loadSettings, loadCurrentHours } = useUserStore();

  useEffect(() => {
    // Load user settings and hours on mount
    const loadData = async () => {
      try {
        await loadSettings();
        await loadCurrentHours();
      } catch (err) {
        console.error("[App] Failed to load data:", err);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-truehour-dark">
        <div className="bg-truehour-card border border-truehour-red p-6 rounded-lg max-w-md">
          <h2 className="text-truehour-red text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-slate-300">{error}</p>
          <button
            onClick={() => {
              loadSettings();
              loadCurrentHours();
            }}
            className="mt-4 px-4 py-2 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-truehour-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-truehour-blue mx-auto mb-4"></div>
          <p className="text-slate-400">Loading TrueHour...</p>
        </div>
      </div>
    );
  }

  // Check if onboarding is needed
  if (settings && !settings.onboarding_completed) {
    return <OnboardingWizard />;
  }

  // Main app
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<SummaryView />} />
        <Route path="/budget" element={<BudgetView />} />
        <Route path="/expenses" element={<ExpensesView />} />
        <Route path="/flights" element={<FlightsView />} />
        <Route path="/aircraft" element={<AircraftView />} />
        <Route path="/aircraft/rates" element={<AircraftRatesView />} />
        <Route path="/reports" element={<ReportsView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Routes>
    </DashboardLayout>
  );
}

export default App;
