// Hamburger Menu Component
// Slide-out menu for import/export and settings

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface HamburgerMenuProps {
  onImportLogbook: () => void;
  onImportExpenses: () => void;
}

export function HamburgerMenu({ onImportLogbook, onImportExpenses }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleImportLogbookClick = () => {
    setIsOpen(false);
    onImportLogbook();
  };

  const handleImportExpensesClick = () => {
    setIsOpen(false);
    onImportExpenses();
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-300 hover:text-white hover:bg-truehour-card rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-truehour-darker border-r border-truehour-border z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border">
          <h2 className="text-xl font-bold text-white">Menu</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {/* Import Logbook */}
          <button
            onClick={handleImportLogbookClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:text-white hover:bg-truehour-card rounded-lg transition-colors group"
          >
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">Import Logbook</div>
              <div className="text-xs text-slate-500">Import flights from ForeFlight, etc.</div>
            </div>
          </button>

          {/* Import Expenses */}
          <button
            onClick={handleImportExpensesClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:text-white hover:bg-truehour-card rounded-lg transition-colors group"
          >
            <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">Import Expenses</div>
              <div className="text-xs text-slate-500">Load expenses from CSV</div>
            </div>
          </button>

          {/* Export Data - Coming Soon */}
          <button
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-500 cursor-not-allowed rounded-lg opacity-50"
          >
            <div className="p-2 bg-green-500/10 rounded-lg">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium flex items-center gap-2">
                Export Data
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Coming Soon
                </span>
              </div>
              <div className="text-xs text-slate-500">Save data to file</div>
            </div>
          </button>

          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-truehour-border" />
          </div>

          {/* Settings */}
          <button
            onClick={handleSettingsClick}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:text-white hover:bg-truehour-card rounded-lg transition-colors group"
          >
            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">Settings</div>
              <div className="text-xs text-slate-500">Customize your experience</div>
            </div>
          </button>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-truehour-border">
          <div className="text-xs text-slate-500 text-center">
            <div className="mb-1">TrueHour by FliteAxis</div>
            <div>v2.0.0</div>
          </div>
        </div>
      </div>
    </>
  );
}
