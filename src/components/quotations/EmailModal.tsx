'use client';

import { SendConfirm } from '@/types/quotations';

type Props = {
  sendConfirm: SendConfirm;
  onClose: () => void;
  onUpdate: (state: SendConfirm) => void;
  onSend: () => void;
  sending: boolean;
};

export function EmailModal({ sendConfirm, onClose, onUpdate, onSend, sending }: Props) {
  if (!sendConfirm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg border border-border w-full max-w-md mx-4 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Send Quotation via Email?</h3>
        <p className="text-sm text-gray-600 mb-3">
          Send quotation <strong>{sendConfirm.subject}</strong> to <strong>{sendConfirm.to}</strong>?
        </p>
        <div className="space-y-2 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">CC</label>
            <input
              type="text"
              value={sendConfirm.cc}
              onChange={e => onUpdate({ ...sendConfirm, cc: e.target.value })}
              placeholder="cc@example.com, cc2@example.com"
              className="w-full border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">BCC</label>
            <input
              type="text"
              value={sendConfirm.bcc}
              onChange={e => onUpdate({ ...sendConfirm, bcc: e.target.value })}
              placeholder="bcc@example.com"
              className="w-full border border-border rounded-md px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded-lg">
          Make sure the quotation details are correct before sending.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSend}
            disabled={sending}
            className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Sending...
              </>
            ) : (
              'Send Quotation'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
