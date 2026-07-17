'use client';

import { Plan, PlanForm } from '@/types/settings';

type Props = {
  show: boolean;
  planForm: PlanForm;
  editingPlan: Plan | null;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: keyof PlanForm, value: string) => void;
};

export default function PlanModal({ show, planForm, editingPlan, onClose, onSave, onFieldChange }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 pb-10 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingPlan ? 'Edit Plan' : 'Add Plan'}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Plan Name</label>
            <input type="text" value={planForm.name}
              onChange={e => onFieldChange('name', e.target.value)}
              placeholder="e.g. Professional"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Price (USD/month)</label>
            <input type="number" step="0.01" min="0" value={planForm.price}
              onChange={e => onFieldChange('price', e.target.value)}
              placeholder="9.99"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Description</label>
            <textarea value={planForm.description}
              onChange={e => onFieldChange('description', e.target.value)}
              placeholder="What's included..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand resize-none" />
          </div>
          <button onClick={onSave}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors">
            {editingPlan ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
