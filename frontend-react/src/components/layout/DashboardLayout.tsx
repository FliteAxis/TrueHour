import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HamburgerMenu } from '../common/HamburgerMenu';
import { ImportDataModal } from '../common/ImportDataModal';
import { ExpenseImportModal } from '../common/ExpenseImportModal';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/dashboard', label: 'Summary' },
  { path: '/budget', label: 'Budget' },
  { path: '/expenses', label: 'Expenses' },
  { path: '/flights', label: 'Flights' },
  { path: '/reports', label: 'Reports' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const [isLogbookImportModalOpen, setIsLogbookImportModalOpen] = useState(false);
  const [isExpenseImportModalOpen, setIsExpenseImportModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-truehour-dark">
      {/* Header */}
      <header className="bg-truehour-darker border-b border-truehour-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side: Hamburger + Logo */}
            <div className="flex items-center space-x-3">
              <HamburgerMenu
                onImportLogbook={() => setIsLogbookImportModalOpen(true)}
                onImportExpenses={() => setIsExpenseImportModalOpen(true)}
              />
              <img src="/logo.png" alt="TrueHour" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold text-white leading-tight">
                  TrueHour
                </h1>
                <p className="text-xs text-truehour-blue">by FliteAxis</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${
                        isActive
                          ? 'bg-truehour-blue text-white'
                          : 'text-slate-300 hover:bg-truehour-card hover:text-white'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Import Modals */}
      <ImportDataModal isOpen={isLogbookImportModalOpen} onClose={() => setIsLogbookImportModalOpen(false)} />
      <ExpenseImportModal isOpen={isExpenseImportModalOpen} onClose={() => setIsExpenseImportModalOpen(false)} />
    </div>
  );
}
