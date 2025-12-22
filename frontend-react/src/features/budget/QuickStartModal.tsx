// Quick Start Budget Cards Modal
// Provides template cards for common aviation expenses

import { useState } from 'react';
import { useBudgetStore } from '../../store/budgetStore';

interface TemplateCard {
  name: string;
  amount: number;
  category: string;
  description: string;
  icon: string;
  isOneTime: boolean;
}

const TEMPLATE_CARDS: TemplateCard[] = [
  {
    name: 'Flight Instruction',
    amount: 5000,
    category: 'Training',
    description: 'Flight and ground instruction costs',
    icon: '',
    isOneTime: false,
  },
  {
    name: 'Aircraft Rental',
    amount: 8000,
    category: 'Aircraft Rental',
    description: 'Aircraft rental for training flights',
    icon: '',
    isOneTime: false,
  },
  {
    name: 'Medical Exam',
    amount: 300,
    category: 'Medical',
    description: 'FAA medical examination',
    icon: '',
    isOneTime: true,
  },
  {
    name: 'FAA Knowledge Test',
    amount: 250,
    category: 'Exams & Checkrides',
    description: 'Written exam fee',
    icon: '',
    isOneTime: true,
  },
  {
    name: 'Checkride',
    amount: 1000,
    category: 'Exams & Checkrides',
    description: 'Practical exam with DPE',
    icon: '',
    isOneTime: true,
  },
  {
    name: 'Aviation Headset',
    amount: 500,
    category: 'Equipment',
    description: 'Headset and accessories',
    icon: '',
    isOneTime: true,
  },
  {
    name: 'Books & Materials',
    amount: 300,
    category: 'Books & Materials',
    description: 'Training materials and books',
    icon: '',
    isOneTime: true,
  },
  {
    name: 'ForeFlight Subscription',
    amount: 275,
    category: 'Subscriptions',
    description: 'Annual subscription',
    icon: '',
    isOneTime: false,
  },
  {
    name: 'Ground School',
    amount: 300,
    category: 'Ground School',
    description: 'Online or in-person ground school',
    icon: '',
    isOneTime: true,
  },
];

interface QuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickStartModal({ isOpen, onClose }: QuickStartModalProps) {
  const { selectedYear, createCard, loadCards } = useBudgetStore();
  const [selectedTemplates, setSelectedTemplates] = useState<Set<number>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTemplate = (index: number) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTemplates(newSelected);
  };

  const createAllTemplates = async () => {
    setIsCreating(true);
    setError(null);
    try {
      // Create all template cards
      for (const template of TEMPLATE_CARDS) {
        await createCard({
          name: template.name,
          budgeted_amount: template.amount,
          category: template.category,
          notes: template.description,
          frequency: template.isOneTime ? 'once' : 'annual',
          when_date: `${selectedYear}-01-01`,
          status: 'active',
        });
      }

      // Reload cards to show the new ones
      await loadCards(selectedYear);

      onClose();
    } catch (err) {
      console.error('Failed to create template cards:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create budget cards';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const createSelectedTemplates = async () => {
    if (selectedTemplates.size === 0) {
      setError('Please select at least one template card');
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      // Create only selected template cards
      for (const index of Array.from(selectedTemplates)) {
        const template = TEMPLATE_CARDS[index];
        await createCard({
          name: template.name,
          budgeted_amount: template.amount,
          category: template.category,
          notes: template.description,
          frequency: template.isOneTime ? 'once' : 'annual',
          when_date: `${selectedYear}-01-01`,
          status: 'active',
        });
      }

      // Reload cards to show the new ones
      await loadCards(selectedYear);

      onClose();
    } catch (err) {
      console.error('Failed to create selected template cards:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create budget cards';
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-truehour-darker border border-truehour-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-truehour-border">
          <h2 className="text-2xl font-bold text-white">Quick Start Budget Cards</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <div className="px-6 py-4 border-b border-truehour-border">
          <p className="text-slate-400">
            Select templates to quickly create budget cards for common aviation expenses. Click any card to add it to your budget.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Template Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATE_CARDS.map((template, index) => (
              <button
                key={index}
                onClick={() => toggleTemplate(index)}
                className={`bg-truehour-card border-2 rounded-lg p-6 text-left transition-all hover:border-truehour-blue/50 ${
                  selectedTemplates.has(index)
                    ? 'border-truehour-blue bg-truehour-blue/10'
                    : 'border-truehour-border'
                }`}
              >
                {/* Name */}
                <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>

                {/* Amount */}
                <div className="text-2xl font-bold text-truehour-blue mb-2">
                  ${template.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-400">{template.description}</p>

                {/* Selection indicator */}
                {selectedTemplates.has(index) && (
                  <div className="mt-4 flex items-center gap-2 text-truehour-blue">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-truehour-border gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-truehour-card border border-truehour-border text-white rounded-lg hover:bg-truehour-darker transition-colors"
            disabled={isCreating}
          >
            Close
          </button>

          <div className="flex gap-4">
            <button
              onClick={createAllTemplates}
              className="px-6 py-3 bg-truehour-card border border-truehour-blue text-truehour-blue rounded-lg hover:bg-truehour-blue/10 transition-colors disabled:opacity-50"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create All Templates'}
            </button>

            <button
              onClick={createSelectedTemplates}
              className="px-6 py-3 bg-truehour-blue text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              disabled={isCreating || selectedTemplates.size === 0}
            >
              {isCreating ? 'Creating...' : `Create Selected (${selectedTemplates.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
