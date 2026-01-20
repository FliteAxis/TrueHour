import { useState, useEffect } from "react";
import * as api from "../../services/api";
import {
  exportBudgetSummaryPDF,
  exportCertificationProgressPDF,
  exportFlightLogPDF,
  exportAnnualBudgetPDF,
} from "../../utils/pdfExport";
import type { BudgetCategorySummary, HoursData, Flight } from "../../types/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

type CertificationType = "ppl" | "ir" | "cpl";

export function ReportsView() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetCategorySummary[]>([]);
  const [hoursData, setHoursData] = useState<HoursData | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCert, setSelectedCert] = useState<CertificationType>("ppl");

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      const [budget, importHistory, flightList] = await Promise.all([
        api.getBudgetCardsSummaryByCategory(selectedYear),
        api.getLatestImportHistory(),
        api.getFlights(),
      ]);

      setBudgetData(budget);
      setHoursData(importHistory?.hours_imported || null);
      setFlights(flightList);
    } catch (error) {
      console.error("Failed to load data for reports:", error);
    }
  };

  const handleExport = async (endpoint: string, filename: string) => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Export failed");
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = async (reportType: string) => {
    setIsExporting(true);
    setExportError(null);

    try {
      switch (reportType) {
        case "budget-summary":
          await exportBudgetSummaryPDF(budgetData, null);
          break;
        case "certification-progress":
          if (hoursData) {
            await exportCertificationProgressPDF(hoursData, selectedCert, null);
          } else {
            throw new Error("Hours data not loaded");
          }
          break;
        case "flight-log":
          await exportFlightLogPDF(flights);
          break;
        case "annual-budget":
          await exportAnnualBudgetPDF(budgetData, selectedYear);
          break;
        default:
          throw new Error("Unknown report type");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF export failed";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">Reports & Exports</h2>
        <p className="text-slate-400 mt-2">
          Export your data in CSV format for use in spreadsheets or other applications.
        </p>
      </div>

      {exportError && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{exportError}</p>
        </div>
      )}

      {/* CSV Exports Section */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg">
        <div className="p-6 border-b border-truehour-border">
          <h3 className="text-xl font-semibold text-white">Data Exports (CSV)</h3>
          <p className="text-slate-400 text-sm mt-1">
            Download your data as CSV files for backup or analysis in Excel/Google Sheets
          </p>
        </div>

        <div className="p-6 grid gap-4 md:grid-cols-2">
          {/* Flights Export */}
          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4 hover:border-truehour-accent transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Flight Log</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Complete flight history with all details (hours, approaches, routes, etc.)
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleExport(
                  "/api/user/exports/flights/csv",
                  `truehour_flights_${new Date().toISOString().split("T")[0]}.csv`
                )
              }
              disabled={isExporting}
              className="mt-4 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exporting..." : "Export Flights"}
            </button>
          </div>

          {/* Budget Cards Export */}
          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4 hover:border-truehour-accent transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Budget Cards</h4>
                <p className="text-sm text-slate-400 mt-1">
                  All budget cards with amounts, categories, and aircraft linkage
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleExport(
                  "/api/user/exports/budget-cards/csv",
                  `truehour_budget_cards_${new Date().toISOString().split("T")[0]}.csv`
                )
              }
              disabled={isExporting}
              className="mt-4 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exporting..." : "Export Budget Cards"}
            </button>
          </div>

          {/* Expenses Export */}
          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4 hover:border-truehour-accent transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Expenses</h4>
                <p className="text-sm text-slate-400 mt-1">
                  All expense records with dates, amounts, categories, and vendors
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleExport(
                  "/api/user/exports/expenses/csv",
                  `truehour_expenses_${new Date().toISOString().split("T")[0]}.csv`
                )
              }
              disabled={isExporting}
              className="mt-4 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exporting..." : "Export Expenses"}
            </button>
          </div>

          {/* Aircraft Export */}
          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4 hover:border-truehour-accent transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Aircraft</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Aircraft fleet with specifications, rates, and characteristics
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleExport(
                  "/api/user/exports/aircraft/csv",
                  `truehour_aircraft_${new Date().toISOString().split("T")[0]}.csv`
                )
              }
              disabled={isExporting}
              className="mt-4 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exporting..." : "Export Aircraft"}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Reports Section */}
      <div className="bg-truehour-card border border-truehour-border rounded-lg">
        <div className="p-6 border-b border-truehour-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white">PDF Reports</h3>
              <p className="text-slate-400 text-sm mt-1">Formatted PDF reports for printing or sharing</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400 text-sm">Report Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-truehour-darker border border-truehour-border rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-truehour-accent"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 grid gap-4 md:grid-cols-2">
          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Budget Summary Report</h4>
                <p className="text-sm text-slate-400 mt-1">Professional budget overview with charts and breakdowns</p>
              </div>
            </div>
            <button
              onClick={() => handlePDFExport("budget-summary")}
              disabled={isExporting || budgetData.length === 0}
              className="mt-4 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Generating..." : "Generate PDF"}
            </button>
          </div>

          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Certification Progress Report</h4>
                <p className="text-sm text-slate-400 mt-1">
                  Detailed certification tracking with requirements checklist
                </p>
              </div>
            </div>
            <select
              value={selectedCert}
              onChange={(e) => setSelectedCert(e.target.value as CertificationType)}
              className="mt-3 w-full bg-truehour-darker border border-truehour-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-truehour-accent"
            >
              <option value="ppl">Private Pilot</option>
              <option value="ir">Instrument Rating</option>
              <option value="cpl">Commercial Pilot</option>
            </select>
            <button
              onClick={() => handlePDFExport("certification-progress")}
              disabled={isExporting || !hoursData}
              className="mt-3 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Generating..." : "Generate PDF"}
            </button>
          </div>

          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Flight Log Report</h4>
                <p className="text-sm text-slate-400 mt-1">Formatted flight log suitable for printing or FAA records</p>
              </div>
            </div>
            <button
              onClick={() => handlePDFExport("flight-log")}
              disabled={isExporting || flights.length === 0}
              className="mt-4 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Generating..." : "Generate PDF"}
            </button>
          </div>

          <div className="bg-truehour-darker border border-truehour-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-white">Annual Budget Report</h4>
                <p className="text-sm text-slate-400 mt-1">Year-end summary with budget vs actual analysis</p>
              </div>
            </div>
            <button
              onClick={() => handlePDFExport("annual-budget")}
              disabled={isExporting || budgetData.length === 0}
              className="mt-4 w-full px-4 py-2 bg-truehour-accent hover:bg-truehour-accent-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? "Generating..." : "Generate PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">Export Tips</h4>
        <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
          <li>CSV files can be opened in Excel, Google Sheets, Numbers, or any spreadsheet application</li>
          <li>All exports include current data - use filters in the app before exporting if needed</li>
          <li>File names include the export date for easy organization</li>
          <li>Exports are generated fresh each time - no cached or stale data</li>
        </ul>
      </div>
    </div>
  );
}
