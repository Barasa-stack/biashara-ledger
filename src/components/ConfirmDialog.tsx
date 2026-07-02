'use client';
import { useState } from 'react';

export function useConfirm() {
  const [state, setState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);
  const confirm = (message: string) => new Promise<boolean>(resolve => setState({ message, resolve }));
  const dialog = state ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => { state.resolve(false); setState(null); }}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-gray-700 mb-5">{state.message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => { state.resolve(false); setState(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg transition-colors">Cancel</button>
          <button onClick={() => { state.resolve(true); setState(null); }} className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors">Confirm</button>
        </div>
      </div>
    </div>
  ) : null;
  return { confirm, dialog };
}
