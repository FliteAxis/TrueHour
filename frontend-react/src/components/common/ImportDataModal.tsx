// Import Data Modal
// Modal for importing flight data from various sources

import { useState } from "react";
import { ImportResultsModal } from "./ImportResultsModal";

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AircraftResult {
  id: number;
  tail_number: string;
  make?: string;
  model?: string;
  year?: number;
  data_source?: "faa" | "foreflight" | "manual";
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  aircraft_created?: AircraftResult[];
}

export function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
  const [importType, setImportType] = useState<"foreflight" | "myflightbook" | "csv">("foreflight");
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("import_type", importType);

      const response = await fetch("/api/flights/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Import failed" }));
        throw new Error(errorData.detail || "Import failed");
      }

      const result: ImportResult = await response.json();
      console.log("Import successful:", result);

      // Fetch aircraft details if we have IDs
      if (result.aircraft_created && result.aircraft_created.length > 0) {
        // Aircraft data should already be in the response from backend
        setImportResults(result);
      } else {
        setImportResults(result);
      }

      // Show results modal
      setShowResults(true);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setFile(null);
      setError(null);
      setShowResults(false);
      setImportResults(null);
      onClose();
    }
  };

  const handleResultsClose = () => {
    setShowResults(false);
    setImportResults(null);
    // Refresh the page to show new data
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-truehour-card border border-truehour-border rounded-lg w-full max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-truehour-border">
            <h2 className="text-2xl font-bold text-white">Import Flight Data</h2>
            <button
              onClick={handleClose}
              disabled={isImporting}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Import Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Select Import Source</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setImportType("foreflight")}
                    disabled={isImporting}
                    className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                      importType === "foreflight"
                        ? "border-truehour-blue bg-blue-500/10"
                        : "border-truehour-border hover:border-truehour-blue/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-white font-medium mb-1">ForeFlight</div>
                      <div className="text-xs text-slate-400">.csv export</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setImportType("myflightbook")}
                    disabled={isImporting}
                    className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                      importType === "myflightbook"
                        ? "border-truehour-blue bg-blue-500/10"
                        : "border-truehour-border hover:border-truehour-blue/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-white font-medium mb-1">MyFlightbook</div>
                      <div className="text-xs text-slate-400">.csv export</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setImportType("csv")}
                    disabled={isImporting}
                    className={`p-4 rounded-lg border-2 transition-all disabled:opacity-50 ${
                      importType === "csv"
                        ? "border-truehour-blue bg-blue-500/10"
                        : "border-truehour-border hover:border-truehour-blue/50"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-white font-medium mb-1">Generic CSV</div>
                      <div className="text-xs text-slate-400">Custom format</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">
                  Select File
                </label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="file-upload"
                    className={`flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed rounded-lg transition-colors ${
                      isImporting
                        ? "border-truehour-border cursor-not-allowed opacity-50"
                        : "border-truehour-border hover:border-truehour-blue cursor-pointer group"
                    }`}
                  >
                    <div className="text-center">
                      <svg
                        className={`w-12 h-12 mx-auto mb-3 transition-colors ${
                          isImporting ? "text-slate-600" : "text-slate-400 group-hover:text-truehour-blue"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      {file ? (
                        <div>
                          <div className="text-white font-medium mb-1">{file.name}</div>
                          <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-white font-medium mb-1">Click to select file</div>
                          <div className="text-xs text-slate-400">or drag and drop</div>
                        </div>
                      )}
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={isImporting}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-300">
                    <div className="font-medium mb-1">Import Tips</div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>ForeFlight: Export your logbook as CSV from Settings → Logbook → Export</li>
                      <li>MyFlightbook: Download your logbook CSV from the web interface</li>
                      <li>Files are processed on the server and duplicate entries are automatically detected</li>
                      <li>Aircraft will be automatically looked up in the FAA registry when available</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Import Progress */}
              {isImporting && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                    <div className="text-sm text-emerald-300">
                      <div className="font-medium mb-1">Processing your import...</div>
                      <div className="text-xs text-emerald-400">
                        • Parsing CSV file
                        <br />• Looking up aircraft in FAA registry
                        <br />• Importing flights and calculating hours
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-truehour-border">
            <button
              onClick={handleClose}
              disabled={isImporting}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !file}
              className="px-6 py-2 bg-truehour-blue hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Import Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import Results Modal */}
      {importResults && (
        <ImportResultsModal
          isOpen={showResults}
          onClose={handleResultsClose}
          flightsImported={importResults.imported}
          flightsSkipped={importResults.skipped}
          aircraft={importResults.aircraft_created || []}
          errors={importResults.errors}
        />
      )}
    </>
  );
}
