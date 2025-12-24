// Hamburger Menu Component
// Comprehensive navigation menu with organized sections

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface HamburgerMenuProps {
  onImportLogbook: () => void;
  onImportExpenses: () => void;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  comingSoon?: boolean;
}

interface MenuItem {
  label: string;
  path?: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

export function HamburgerMenu({ onImportLogbook, onImportExpenses }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["Backend"]);
  const navigate = useNavigate();
  const location = useLocation();

  // Define menu sections
  const menuSections: MenuSection[] = [
    {
      title: "Backend",
      items: [
        { label: "Flight Log", path: "/flights" },
        { label: "Import from ForeFlight", onClick: () => onImportLogbook() },
        { label: "Manual Entry", path: "/flights", comingSoon: true },
      ],
    },
    {
      title: "Aircraft",
      items: [
        { label: "My Aircraft", path: "/aircraft" },
        { label: "Aircraft Rates", path: "/aircraft/rates", comingSoon: true },
        { label: "Aircraft Management", path: "/aircraft/manage", comingSoon: true },
      ],
    },
    {
      title: "Finances",
      items: [
        { label: "Budget", path: "/budget" },
        { label: "Expense List", path: "/expenses" },
        { label: "Reports", path: "/reports" },
        { label: "Import Expenses", onClick: () => onImportExpenses() },
        { label: "Create Expense", path: "/expenses/create", comingSoon: true },
        { label: "Link to Budget Cards", path: "/expenses/link", comingSoon: true },
      ],
    },
    // Hidden for now - will be enabled later
    // {
    //   title: "Integrations",
    //   comingSoon: true,
    //   items: [
    //     { label: "ForeFlight Sync", path: "/integrations/foreflight", comingSoon: true },
    //     { label: "Cloud Backup", path: "/integrations/backup", comingSoon: true },
    //     { label: "API Keys", path: "/integrations/api", comingSoon: true },
    //   ],
    // },
  ];

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle) ? prev.filter((s) => s !== sectionTitle) : [...prev, sectionTitle]
    );
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.comingSoon) return;

    setIsOpen(false);
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const isActivePath = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" onClick={() => setIsOpen(false)} />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed top-0 h-full w-80 bg-truehour-darker z-[110] transform transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen
            ? "left-0 translate-x-0 border-r border-truehour-border shadow-2xl"
            : "-left-full -translate-x-full pointer-events-none"
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

        {/* Menu Sections */}
        <nav className="p-4 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 180px)" }}>
          {menuSections.map((section) => (
            <div key={section.title} className="mb-2">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-slate-400 hover:text-white transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">{section.title}</span>
                  {section.comingSoon && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Coming Soon
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${expandedSections.includes(section.title) ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Section Items */}
              {expandedSections.includes(section.title) && (
                <div className="ml-2 space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => handleMenuItemClick(item)}
                      disabled={item.comingSoon}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-lg transition-colors
                        ${item.comingSoon ? "text-slate-600 cursor-not-allowed" : "text-slate-300 hover:text-white hover:bg-truehour-card"}
                        ${isActivePath(item.path) && !item.comingSoon ? "bg-truehour-blue/20 text-white" : ""}
                      `}
                    >
                      <span>{item.label}</span>
                      {item.comingSoon && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">Soon</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="py-2">
            <div className="border-t border-truehour-border" />
          </div>

          {/* Settings */}
          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/settings");
            }}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors
              ${location.pathname === "/settings" ? "bg-truehour-blue/20 text-white" : "text-slate-300 hover:text-white hover:bg-truehour-card"}
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Settings</span>
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
