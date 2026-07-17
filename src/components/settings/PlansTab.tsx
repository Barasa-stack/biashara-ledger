'use client';

import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Plan, PlanForm } from '@/types/settings';

type Props = {
  plans: Plan[];
  loading: boolean;
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
};

export default function PlansTab({ plans, loading, onEdit, onDelete, onAdd }: Props) {
  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-4 max-w-lg">
      {plans.map(plan => (
        <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">{plan.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">${parseFloat(String(plan.price)).toFixed(2)}/mo</p>
            {plan.description && <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(plan)} className="text-sm text-brand hover:text-brand font-medium">Edit</button>
            <button onClick={() => onDelete(plan.id)} className="text-sm text-red-500 hover:text-red-700">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
      <button onClick={onAdd} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-brand border-2 border-dashed border-gray-200 rounded-lg hover:border-brand/30 hover:bg-brand-light transition-all">
        <Plus size={16} /> Add Plan
      </button>
    </div>
  );
}
