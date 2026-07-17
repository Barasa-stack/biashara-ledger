'use client';

import { useState } from 'react';
import { Package, Plus, BarChart3, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    title: 'Add Your Products',
    desc: 'List every item you sell — soda, rice, soap, anything. Give each a name and a category so they\'re easy to find later.',
    icon: Plus,
    highlight: 'Item Name, Category',
  },
  {
    title: 'Set Your Quantities',
    desc: 'Tell us how many of each item you have right now. Also set a "Low Stock Alert" — we\'ll warn you when you\'re running low.',
    icon: Package,
    highlight: 'Opening Stock, Reorder Level',
  },
  {
    title: 'Track & Grow',
    desc: 'Your inventory dashboard updates automatically with every sale and purchase. You\'ll always know what\'s in stock and what needs restocking.',
    icon: BarChart3,
    highlight: 'Reports, Low Stock Alerts',
  },
];

interface InventoryOnboardingProps {
  onAddItem: () => void;
  onDismiss: () => void;
}

export default function InventoryOnboarding({ onAddItem, onDismiss }: InventoryOnboardingProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  return (
    <div className="bg-white rounded-xl border border-border p-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-brand' : i < step ? 'w-4 bg-brand/40' : 'w-4 bg-gray-200'
              }`}
            />
          ))}
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex flex-col items-center text-center py-4">
        <div className="w-14 h-14 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
          <current.icon className="h-7 w-7 text-brand" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {current.title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
          {current.desc}
        </p>
        <span className="mt-3 text-xs text-brand font-medium bg-brand/5 px-3 py-1 rounded-full">
          {current.highlight}
        </span>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border mt-2">
        <button
          onClick={onDismiss}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          I&rsquo;ll figure it out
        </button>
        <div className="flex gap-2">
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-hover transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Your First Product
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
