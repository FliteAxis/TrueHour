// Expense Import Modal
// Modal for importing expense data from CSV

import { useState } from "react";

interface ExpenseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseImportModal({ isOpen, onClose }: ExpenseImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormat, setShowFormat] = useState(false);

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

      const response = await fetch("/api/expenses/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Import failed");
      }

      const result = await response.json();
      console.log("Import successful:", result);

      // Close modal and refresh data
      onClose();
      window.location.reload(); // Simple refresh for now
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import expenses");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const headers = [
      "date",
      "category",
      "amount",
      "vendor",
      "description",
      "subcategory",
      "is_recurring",
      "is_tax_deductible",
      "budget_card_id",
    ];
    const example = [
      "2024-01-15",
      "Flight Training",
      "250.00",
      "Local Flight School",
      "Dual instruction - pattern work",
      "Dual instruction",
      "false",
      "true",
      "1",
    ];

    const csvContent = [
      headers.join(","),
      example.join(","),
      // Add a few blank rows for user to fill in
      "",
      "",
      "",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "truehour_expense_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (!isImporting) {
      setFile(null);
      setError(null);
      setShowFormat(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-truehour-card border border-truehour-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border">
          <h2 className="text-2xl font-bold text-white">Import Expenses</h2>
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
            {/* File Upload */}
            <div>
              <label htmlFor="expense-file-upload" className="block text-sm font-medium text-slate-300 mb-2">
                Select CSV File
              </label>
              <div className="flex items-center gap-3">
                <label
                  htmlFor="expense-file-upload"
                  className="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-truehour-border rounded-lg hover:border-truehour-blue transition-colors cursor-pointer group"
                >
                  <div className="text-center">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-slate-400 group-hover:text-truehour-blue transition-colors"
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
                        <div className="text-white font-medium mb-1">Click to select CSV file</div>
                        <div className="text-xs text-slate-400">or drag and drop</div>
                      </div>
                    )}
                  </div>
                  <input
                    id="expense-file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* CSV Format Guide */}
            <div className="bg-truehour-darker border border-truehour-border rounded-lg">
              <button
                onClick={() => setShowFormat(!showFormat)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-white font-medium">CSV Format Guide</span>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 transition-transform ${showFormat ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showFormat && (
                <div className="p-4 pt-0 space-y-4">
                  <div className="text-sm text-slate-300">
                    <p className="mb-3">Your CSV file should have the following columns (order doesn't matter):</p>

                    <div className="bg-truehour-card border border-truehour-border rounded p-3 mb-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-green-400 font-mono">date</span>
                          <span className="text-red-400">*</span>
                          <span className="text-slate-500"> - YYYY-MM-DD format</span>
                        </div>
                        <div>
                          <span className="text-green-400 font-mono">category</span>
                          <span className="text-red-400">*</span>
                          <span className="text-slate-500"> - Expense category</span>
                        </div>
                        <div>
                          <span className="text-green-400 font-mono">amount</span>
                          <span className="text-red-400">*</span>
                          <span className="text-slate-500"> - Dollar amount</span>
                        </div>
                        <div>
                          <span className="text-blue-400 font-mono">vendor</span>
                          <span className="text-slate-500"> - Vendor/seller name</span>
                        </div>
                        <div>
                          <span className="text-blue-400 font-mono">description</span>
                          <span className="text-slate-500"> - Expense details</span>
                        </div>
                        <div>
                          <span className="text-blue-400 font-mono">subcategory</span>
                          <span className="text-slate-500"> - Subcategory</span>
                        </div>
                        <div>
                          <span className="text-blue-400 font-mono">is_recurring</span>
                          <span className="text-slate-500"> - true/false</span>
                        </div>
                        <div>
                          <span className="text-blue-400 font-mono">is_tax_deductible</span>
                          <span className="text-slate-500"> - true/false</span>
                        </div>
                        <div>
                          <span className="text-blue-400 font-mono">budget_card_id</span>
                          <span className="text-slate-500"> - Budget card ID</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="text-red-400">*</span> = Required fields
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <p>
                        <strong>Valid Categories:</strong>
                      </p>
                      <p className="text-slate-400">
                        Flight Training, Aircraft Rental, Ground School, Books & Materials, Exams & Checkrides, Medical,
                        Equipment, Insurance, Membership, Fuel, Maintenance, Other
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-truehour-blue/20 hover:bg-truehour-blue/30 text-truehour-blue font-medium rounded-lg transition-colors border border-truehour-blue/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Download CSV Template
                  </button>
                </div>
              )}
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
                    <li>Download the template to see the correct format</li>
                    <li>Dates must be in YYYY-MM-DD format (e.g., 2024-01-15)</li>
                    <li>Amount should be a number without dollar signs or commas</li>
                    <li>Duplicate expenses (same date, amount, and category) will be skipped</li>
                    <li>Invalid rows will be reported in the import summary</li>
                  </ul>
                </div>
              </div>
            </div>
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
                Import Expenses
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
