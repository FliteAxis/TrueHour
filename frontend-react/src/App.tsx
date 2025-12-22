import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useUserStore } from './store/userStore';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { SummaryView } from './features/dashboard/SummaryView';
import { BudgetView } from './features/budget/BudgetView';
import { ExpensesView } from './features/expenses/ExpensesView';
import { FlightsView } from './features/flights/FlightsView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';

function App() {
  const navigate = useNavigate();
  const { settings, isLoading, error, loadSettings, loadCurrentHours, updateSettings } = useUserStore();

  useEffect(() => {
    // Load user settings and hours on mount
    const loadData = async () => {
      try {
        await loadSettings();
        await loadCurrentHours();
      } catch (err) {
        console.error('[App] Failed to load data:', err);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Always render something so we can see what's happening
  console.log('[App] Render state:', { settings, isLoading, error });

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
    const handleSkipOnboarding = async () => {
      try {
        await updateSettings({ onboarding_completed: true });
        navigate('/dashboard');
      } catch (err) {
        console.error('Failed to update onboarding status:', err);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-truehour-dark">
        <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-md text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Welcome to TrueHour!</h2>
          <p className="text-slate-300 mb-6">
            Onboarding flow will go here. For now, you can explore the app.
          </p>
          <button
            onClick={handleSkipOnboarding}
            className="px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Skip to Dashboard
          </button>
        </div>
      </div>
    );
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
        <Route path="/reports" element={<ReportsView />} />
        <Route path="/settings" element={<SettingsView />} />
      </Routes>
    </DashboardLayout>
  );
}

export default App;
