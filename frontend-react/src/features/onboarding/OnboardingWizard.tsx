import { useState } from "react";
import { useUserStore } from "../../store/userStore";
import type { FlightSummary } from "../../types/api";
import { getFlightSummary } from "../../services/api";

type OnboardingPath = "foreflight" | "manual" | "skip";
type ForeFlightStep = "upload" | "aircraft" | "hours" | "certification" | "review";
type ManualStep = "hours" | "aircraft" | "certification" | "review";

interface WizardData {
  // ForeFlight import data
  importedFlights?: number;
  importedAircraft?: any[];
  calculatedHours?: any;

  // Manual entry data
  manualHours?: {
    total: number;
    pic: number;
    xc: number;
    instrument: number;
    simulator: number;
  };

  // Common data
  targetCertification?: string;
  lessonsPerWeek?: number;
}

export default function OnboardingWizard() {
  const { updateSettings } = useUserStore();
  const [selectedPath, setSelectedPath] = useState<OnboardingPath | null>(null);
  const [foreFlightStep, setForeFlightStep] = useState<ForeFlightStep>("upload");
  const [manualStep, setManualStep] = useState<ManualStep>("hours");
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [targetCert, setTargetCert] = useState<string>("PPL");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ aircraft: number; flights: number } | null>(null);
  const [aircraft, setAircraft] = useState<any[]>([]);
  const [filePreview, setFilePreview] = useState<{ aircraft: number; flights: number } | null>(null);
  const [validating, setValidating] = useState(false);
  const [flightSummary, setFlightSummary] = useState<FlightSummary | null>(null);
  const [loadingHours, setLoadingHours] = useState(false);
  const [hoursConfirmed, setHoursConfirmed] = useState(false);

  const completeOnboarding = async () => {
    try {
      await updateSettings({
        onboarding_completed: true,
        target_certification: wizardData.targetCertification || null,
      });
      // Reload the page to ensure settings are refreshed and app loads correctly
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  };

  const handlePathSelect = (path: OnboardingPath) => {
    if (path === "skip") {
      completeOnboarding();
    } else {
      setSelectedPath(path);
    }
  };

  const validateForeFlightCSV = async (file: File) => {
    setValidating(true);
    setUploadError(null);
    setFilePreview(null);

    try {
      const text = await file.text();
      const lines = text.split("\n");

      // Check for ForeFlight header
      if (!lines[0]?.includes("ForeFlight Logbook Import")) {
        throw new Error(
          "This doesn't look like a ForeFlight logbook export. Please make sure you're uploading the correct CSV file."
        );
      }

      // Find Aircraft Table section
      let aircraftCount = 0;
      let flightCount = 0;
      let inAircraftSection = false;
      let inFlightsSection = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("Aircraft Table")) {
          inAircraftSection = true;
          inFlightsSection = false;
          continue;
        }

        if (line.startsWith("Flights Table")) {
          inAircraftSection = false;
          inFlightsSection = true;
          continue;
        }

        // Skip empty lines and header rows
        if (!line || line.startsWith("AircraftID,") || line.startsWith("Date,")) {
          continue;
        }

        // Count aircraft rows
        if (inAircraftSection && line.length > 0) {
          aircraftCount++;
        }

        // Count flight rows
        if (inFlightsSection && line.length > 0) {
          flightCount++;
        }
      }

      if (aircraftCount === 0 && flightCount === 0) {
        throw new Error(
          "No aircraft or flights found in this file. Please check that your ForeFlight export contains data."
        );
      }

      setFilePreview({ aircraft: aircraftCount, flights: flightCount });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to validate file");
      setFilePreview(null);
    } finally {
      setValidating(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setUploadError(null);
    setFilePreview(null);
    setImportSummary(null);

    if (file) {
      validateForeFlightCSV(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:8000/api/user/flights/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to import file");
      }

      const result = await response.json();

      // Store imported data in wizard state
      setWizardData({
        ...wizardData,
        importedFlights: result.imported,
        importedAircraft: result.aircraft_created?.length || 0,
      });

      // Automatically fetch aircraft and advance to aircraft screen
      const aircraftResponse = await fetch("http://localhost:8000/api/user/aircraft");
      const aircraftData = await aircraftResponse.json();
      setAircraft(aircraftData);

      // Advance to aircraft screen
      setForeFlightStep("aircraft");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const fetchFlightSummary = async () => {
    setLoadingHours(true);
    try {
      const summary = await getFlightSummary();
      setFlightSummary(summary);
    } catch (err) {
      console.error("Failed to fetch flight summary:", err);
    } finally {
      setLoadingHours(false);
    }
  };

  // ForeFlight wizard steps
  const renderForeFlightUpload = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 1 of 5</div>
          <h2 className="text-2xl font-bold text-white mb-4">Upload ForeFlight Logbook</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "20%" }}></div>
          </div>
        </div>

        <div className="space-y-4 text-slate-300 mb-6">
          <p>To import your ForeFlight logbook:</p>
          <ol className="list-decimal list-inside space-y-2 ml-4">
            <li>Open ForeFlight on your device</li>
            <li>Go to Logbook → Options (⋮) → Export</li>
            <li>Choose "CSV (Full)" format</li>
            <li>Save or email the CSV file to yourself</li>
            <li>Upload the file below</li>
          </ol>

          <div className="bg-truehour-surface border border-truehour-border p-4 rounded-lg mt-6">
            <h3 className="font-semibold text-white mb-2">What gets imported:</h3>
            <ul className="text-sm space-y-1 text-slate-400">
              <li>✓ All flight entries with complete details</li>
              <li>✓ Aircraft information (tail numbers, types, hours)</li>
              <li>✓ Training hours (dual, solo, cross-country, instrument)</li>
              <li>✓ Approaches, landings, and endorsements</li>
            </ul>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">Select ForeFlight CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              disabled={uploading || validating}
              className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-truehour-blue file:text-white hover:file:bg-blue-600 file:cursor-pointer disabled:opacity-50"
            />
            {selectedFile && !validating && !uploading && !filePreview && !importSummary && (
              <p className="mt-2 text-sm text-slate-400">Selected: {selectedFile.name}</p>
            )}
            {validating && <p className="mt-2 text-sm text-blue-400">Validating file...</p>}
            {filePreview && !uploading && !importSummary && (
              <div className="mt-2 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  ✓ Found {filePreview.aircraft} aircraft, {filePreview.flights} flights in {selectedFile?.name}
                </p>
              </div>
            )}
            {uploading && <p className="mt-2 text-sm text-blue-400">Uploading and processing file...</p>}
            {uploadError && (
              <div className="mt-2 p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
                <p className="text-sm text-red-400">{uploadError}</p>
              </div>
            )}
            {importSummary && (
              <div className="mt-2 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                <p className="text-sm text-green-400">
                  ✓ Successfully imported {importSummary.aircraft} aircraft, {importSummary.flights} flights
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSelectedPath(null)}
            disabled={uploading || validating}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleFileUpload}
            disabled={!filePreview || uploading || validating}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-truehour-blue"
          >
            {uploading ? "Uploading..." : validating ? "Validating..." : "Upload and Process"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderForeFlightAircraft = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-4xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 2 of 5</div>
          <h2 className="text-2xl font-bold text-white mb-4">Review Aircraft</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "40%" }}></div>
          </div>
        </div>

        <p className="text-slate-300 mb-6">
          Review and validate your aircraft. FAA lookup will verify US registrations automatically.
        </p>

        {aircraft.length > 0 ? (
          <div className="space-y-3 mb-6">
            {aircraft.map((ac) => {
              // Determine if FAA lookup was successful
              const isFAAVerified = ac.tail_number?.startsWith("N") && ac.make && ac.model && ac.gear_type;
              const isSimulator =
                ac.aircraft_class?.toLowerCase().includes("simulator") ||
                ac.aircraft_class?.toLowerCase().includes("atd") ||
                ac.aircraft_class?.toLowerCase().includes("ftd");

              return (
                <div key={ac.id} className="bg-truehour-surface border border-truehour-border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-lg">{ac.tail_number}</h3>
                        {isFAAVerified && !isSimulator && (
                          <span className="px-2 py-0.5 bg-green-900/30 border border-green-700/50 text-green-400 text-xs rounded flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            FAA Verified
                          </span>
                        )}
                        {isSimulator && (
                          <span className="px-2 py-0.5 bg-blue-900/30 border border-blue-700/50 text-blue-400 text-xs rounded">
                            Simulator
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">
                        {ac.year ? `${ac.year} ` : ""}
                        {ac.make || "Unknown Make"} {ac.model || "Unknown Model"}
                      </p>
                      {(ac.is_complex || ac.is_high_performance) && (
                        <div className="mt-2 flex gap-2">
                          {ac.is_complex && (
                            <span className="px-2 py-1 bg-orange-900/30 border border-orange-700/50 text-orange-400 text-xs rounded">
                              Complex
                            </span>
                          )}
                          {ac.is_high_performance && (
                            <span className="px-2 py-1 bg-purple-900/30 border border-purple-700/50 text-purple-400 text-xs rounded">
                              High Performance
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-slate-400 ml-4">
                      <div>{ac.engine_type || "Unknown"}</div>
                      <div>{ac.gear_type || "Unknown"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-truehour-surface border border-truehour-border p-4 rounded-lg mb-6 text-center text-slate-400">
            No aircraft found. Please go back and upload your logbook.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setForeFlightStep("upload")}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
          >
            Back
          </button>
          <button
            onClick={async () => {
              await fetchFlightSummary();
              setForeFlightStep("hours");
            }}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  const renderForeFlightHours = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 3 of 5</div>
          <h2 className="text-2xl font-bold text-white mb-4">Verify Flight Hours</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "60%" }}></div>
          </div>
        </div>

        <p className="text-slate-300 mb-6">Review your calculated flight hours from the imported logbook.</p>

        {loadingHours ? (
          <div className="bg-truehour-surface border border-truehour-border rounded-lg p-6 mb-6 text-center">
            <div className="text-slate-400">Loading flight hours...</div>
          </div>
        ) : flightSummary ? (
          <div className="bg-truehour-surface border border-truehour-border rounded-lg p-6 space-y-4 mb-6">
            <div className="flex justify-between items-center border-b border-truehour-border pb-3">
              <span className="text-slate-300">Total Flight Time</span>
              <span className="text-white font-semibold text-lg">
                {Number(flightSummary.total_hours).toFixed(1)} hrs
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-truehour-border pb-3">
              <span className="text-slate-300">PIC Time</span>
              <span className="text-white font-semibold text-lg">{Number(flightSummary.pic_hours).toFixed(1)} hrs</span>
            </div>
            <div className="flex justify-between items-center border-b border-truehour-border pb-3">
              <span className="text-slate-300">Cross Country</span>
              <span className="text-white font-semibold text-lg">
                {Number(flightSummary.cross_country_hours).toFixed(1)} hrs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Instrument Time</span>
              <span className="text-white font-semibold text-lg">
                {(
                  Number(flightSummary.actual_instrument_hours) + Number(flightSummary.simulated_instrument_hours)
                ).toFixed(1)}{" "}
                hrs
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-truehour-surface border border-truehour-border rounded-lg p-6 mb-6 text-center">
            <div className="text-slate-400">No flight data available</div>
          </div>
        )}

        <label className="flex items-center gap-3 p-4 bg-truehour-surface border border-truehour-border rounded-lg mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={hoursConfirmed}
            onChange={(e) => setHoursConfirmed(e.target.checked)}
            className="w-5 h-5 accent-truehour-blue"
          />
          <span className="text-slate-300">I confirm these flight hours are correct</span>
        </label>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setForeFlightStep("aircraft");
              setHoursConfirmed(false);
            }}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => setForeFlightStep("certification")}
            disabled={!hoursConfirmed}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-truehour-blue"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  const renderForeFlightCertification = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 4 of 5</div>
          <h2 className="text-2xl font-bold text-white mb-4">Target Certification</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "80%" }}></div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What certification are you working toward?
            </label>
            <select
              value={targetCert}
              onChange={(e) => {
                setTargetCert(e.target.value);
                setWizardData({ ...wizardData, targetCertification: e.target.value });
              }}
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue [&>option]:bg-truehour-surface [&>option]:text-white"
            >
              <option value="PPL" className="bg-truehour-surface text-white">
                Private Pilot License (PPL)
              </option>
              <option value="IR" className="bg-truehour-surface text-white">
                Instrument Rating (IR)
              </option>
              <option value="CPL" className="bg-truehour-surface text-white">
                Commercial Pilot License (CPL)
              </option>
              <option value="CFI" className="bg-truehour-surface text-white">
                Certified Flight Instructor (CFI)
              </option>
              <option value="ATP" className="bg-truehour-surface text-white">
                Airline Transport Pilot (ATP)
              </option>
              <option value="none" className="bg-truehour-surface text-white">
                Just tracking for fun
              </option>
            </select>
            <p className="mt-2 text-xs text-slate-500">Don't worry, you can change this anytime in Settings</p>
          </div>

          <div className="bg-truehour-surface border border-truehour-border p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2 text-sm">Training Progress Tracking:</h3>
            <ul className="text-xs space-y-1 text-slate-400">
              <li>• Track hours against certification requirements</li>
              <li>• View progress charts and remaining requirements</li>
              <li>• Get insights on what you need to complete</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setForeFlightStep("hours")}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => setForeFlightStep("review")}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  const renderForeFlightReview = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 5 of 5</div>
          <h2 className="text-2xl font-bold text-white mb-4">Review & Complete</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-truehour-surface border border-truehour-border rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Flights Imported</span>
                <span className="text-white">{wizardData.importedFlights || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Aircraft Added</span>
                <span className="text-white">{wizardData.importedAircraft || aircraft.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Certification</span>
                <span className="text-white">{wizardData.targetCertification || "None"}</span>
              </div>
            </div>
          </div>

          <div className="bg-truehour-surface border border-truehour-border p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2 text-sm">Next Steps:</h3>
            <ul className="text-xs space-y-1 text-slate-400">
              <li>• View your flights in the Flights page</li>
              <li>• Set up budget cards to track training costs</li>
              <li>• Monitor your progress toward certification</li>
              <li>• Add expenses to track spending</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setForeFlightStep("certification")}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
          >
            Back
          </button>
          <button
            onClick={completeOnboarding}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Complete Setup ✓
          </button>
        </div>
      </div>
    </div>
  );

  // Manual wizard steps
  const renderManualHours = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 1 of 4</div>
          <h2 className="text-2xl font-bold text-white mb-4">Enter Your Flight Hours</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "25%" }}></div>
          </div>
        </div>

        <p className="text-slate-300 mb-6">
          Enter your current flight hours. Don't worry if you don't have exact numbers - you can update these later.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Total Flight Time</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">PIC Time</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cross Country Time</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Instrument Time</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Simulator Time</label>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSelectedPath(null)}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => setManualStep("aircraft")}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  const renderManualAircraft = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 2 of 4</div>
          <h2 className="text-2xl font-bold text-white mb-4">Add Aircraft</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "50%" }}></div>
          </div>
        </div>

        <p className="text-slate-300 mb-6">
          Add at least one aircraft you fly. You can add more later in the Aircraft page.
        </p>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Make</label>
              <input
                type="text"
                placeholder="e.g., Cessna"
                className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Model</label>
              <input
                type="text"
                placeholder="e.g., 172 Skyhawk"
                className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tail Number (Optional)</label>
            <input
              type="text"
              placeholder="e.g., N12345"
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Hourly Rate ($/hr)</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="150"
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue"
            />
          </div>
        </div>

        <div className="bg-truehour-surface border border-truehour-border p-4 rounded-lg mb-6 text-center text-slate-400">
          No aircraft added yet
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setManualStep("hours")}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => setManualStep("certification")}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  const renderManualCertification = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-md w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 3 of 4</div>
          <h2 className="text-2xl font-bold text-white mb-4">Target Certification</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "75%" }}></div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setManualStep("review");
          }}
          className="space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What certification are you working toward?
            </label>
            <select
              value={targetCert}
              onChange={(e) => {
                setTargetCert(e.target.value);
                setWizardData({ ...wizardData, targetCertification: e.target.value });
              }}
              className="w-full px-4 py-3 bg-truehour-surface border border-truehour-border rounded-lg text-white focus:outline-none focus:border-truehour-blue [&>option]:bg-truehour-surface [&>option]:text-white"
            >
              <option value="PPL" className="bg-truehour-surface text-white">
                Private Pilot License (PPL)
              </option>
              <option value="IR" className="bg-truehour-surface text-white">
                Instrument Rating (IR)
              </option>
              <option value="CPL" className="bg-truehour-surface text-white">
                Commercial Pilot License (CPL)
              </option>
              <option value="CFI" className="bg-truehour-surface text-white">
                Certified Flight Instructor (CFI)
              </option>
              <option value="ATP" className="bg-truehour-surface text-white">
                Airline Transport Pilot (ATP)
              </option>
              <option value="none" className="bg-truehour-surface text-white">
                Just tracking for fun
              </option>
            </select>
            <p className="mt-2 text-xs text-slate-500">Don't worry, you can change this anytime in Settings</p>
          </div>

          <div className="bg-truehour-surface border border-truehour-border p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2 text-sm">Next Steps:</h3>
            <ul className="text-xs space-y-1 text-slate-400">
              <li>• Add your aircraft in the Aircraft page</li>
              <li>• Log flights manually or import from ForeFlight</li>
              <li>• Set up budget cards to track training costs</li>
              <li>• Monitor your progress toward certification</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setManualStep("aircraft")}
              className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderManualReview = () => (
    <div className="min-h-screen flex items-center justify-center bg-truehour-dark p-4">
      <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl w-full">
        <div className="mb-6">
          <div className="text-sm text-slate-400 mb-2">Step 4 of 4</div>
          <h2 className="text-2xl font-bold text-white mb-4">Review & Complete</h2>
          <div className="h-1 bg-truehour-border rounded-full mb-6">
            <div className="h-1 bg-truehour-blue rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-truehour-surface border border-truehour-border rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Hours</span>
                <span className="text-white">{wizardData.manualHours?.total || 0} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Certification</span>
                <span className="text-white">{wizardData.targetCertification || "None"}</span>
              </div>
            </div>
          </div>

          <div className="bg-truehour-surface border border-truehour-border p-4 rounded-lg">
            <h3 className="font-semibold text-white mb-2 text-sm">Get Started:</h3>
            <ul className="text-xs space-y-1 text-slate-400">
              <li>• Add your aircraft in the Aircraft page</li>
              <li>• Log your flights manually or import from ForeFlight</li>
              <li>• Set up budget cards to track training costs</li>
              <li>• Monitor your progress toward certification</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setManualStep("certification")}
            className="px-6 py-3 bg-truehour-surface text-slate-300 rounded-lg hover:bg-truehour-border transition-colors"
          >
            Back
          </button>
          <button
            onClick={completeOnboarding}
            className="flex-1 px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
          >
            Complete Setup ✓
          </button>
        </div>
      </div>
    </div>
  );

  // Landing page - path selection
  if (!selectedPath) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-truehour-dark">
        <div className="bg-truehour-card border border-truehour-border p-8 rounded-lg max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome to TrueHour!</h1>
            <p className="text-slate-300">Let's get you set up. Choose how you'd like to start:</p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => handlePathSelect("foreflight")}
              className="p-6 bg-truehour-surface border-2 border-truehour-border hover:border-truehour-blue rounded-lg transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">📁</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white group-hover:text-truehour-blue transition-colors mb-2">
                    Import ForeFlight Logbook
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Already have a logbook in ForeFlight? Import your CSV export to get started instantly with all your
                    flights, aircraft, and hours.
                  </p>
                  <div className="mt-3 text-truehour-blue text-sm font-medium">Recommended for existing pilots →</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePathSelect("manual")}
              className="p-6 bg-truehour-surface border-2 border-truehour-border hover:border-truehour-blue rounded-lg transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">✏️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white group-hover:text-truehour-blue transition-colors mb-2">
                    Start Fresh
                  </h3>
                  <p className="text-slate-400 text-sm">
                    New to flight training? Set up your profile and start logging flights from scratch. You can always
                    import data later.
                  </p>
                  <div className="mt-3 text-truehour-blue text-sm font-medium">Best for student pilots →</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePathSelect("skip")}
              className="p-4 bg-truehour-surface border border-truehour-border hover:border-slate-500 rounded-lg transition-all text-center"
            >
              <span className="text-slate-400 text-sm">Skip setup and explore the app</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            You can always access these options later from Settings
          </div>
        </div>
      </div>
    );
  }

  // ForeFlight path
  if (selectedPath === "foreflight") {
    switch (foreFlightStep) {
      case "upload":
        return renderForeFlightUpload();
      case "aircraft":
        return renderForeFlightAircraft();
      case "hours":
        return renderForeFlightHours();
      case "certification":
        return renderForeFlightCertification();
      case "review":
        return renderForeFlightReview();
    }
  }

  // Manual path
  if (selectedPath === "manual") {
    switch (manualStep) {
      case "hours":
        return renderManualHours();
      case "aircraft":
        return renderManualAircraft();
      case "certification":
        return renderManualCertification();
      case "review":
        return renderManualReview();
    }
  }

  return null;
}
