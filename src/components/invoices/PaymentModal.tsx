'use client';

import { CheckCircle, X } from 'lucide-react';
import { PaymentModalState, fmtKES } from '@/types/invoices';

type Props = {
  paymentModal: PaymentModalState;
  onClose: () => void;
  onConfirm: () => void;
  onUpdate: (state: PaymentModalState) => void;
  processing: boolean;
};

export function PaymentModal({ paymentModal, onClose, onConfirm, onUpdate, processing }: Props) {
  if (!paymentModal) return null;

  const remaining = paymentModal.invoice.amount - (paymentModal.invoice.paid_amount || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-3">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Confirm Payment</h3>
          <p className="text-sm text-white/80 mt-1">{paymentModal.invoice.invoice_number}</p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex justify-between text-sm py-2 border-b border-gray-100 flex-shrink-0">
            <span className="text-gray-500">Customer</span>
            <span className="font-medium text-gray-800">{paymentModal.invoice.customer_name}</span>
          </div>
          <div className="flex justify-between text-sm py-2 border-b border-gray-100 flex-shrink-0">
            <span className="text-gray-500">Total Amount</span>
            <span className="font-semibold text-gray-800">{fmtKES(paymentModal.invoice.amount)}</span>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-red-50 has-[:checked]:bg-red-50 has-[:checked]:border-red-400">
              <input
                type="radio"
                name="paymentType"
                checked={paymentModal.paymentType === 'full'}
                onChange={() => onUpdate({ ...paymentModal, paymentType: 'full', partialAmount: String(paymentModal.invoice.amount) })}
                className="accent-red-600 w-4 h-4 flex-shrink-0"
              />
              <div className="min-w-0">
                <span className="text-sm font-medium text-gray-800">Full Payment</span>
                <p className="text-xs text-gray-500">Pay the full invoice amount</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-red-50 has-[:checked]:bg-red-50 has-[:checked]:border-red-400">
              <input
                type="radio"
                name="paymentType"
                checked={paymentModal.paymentType === 'partial'}
                onChange={() => onUpdate({ ...paymentModal, paymentType: 'partial', partialAmount: '' })}
                className="accent-red-600 w-4 h-4 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800">Partial Payment</span>
                <p className="text-xs text-gray-500">Pay a portion of the amount</p>
              </div>
            </label>

            {paymentModal.paymentType === 'partial' && (
              <div className="pl-7 space-y-2">
                <div className="flex justify-between text-sm py-1.5 px-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-700 font-medium">Outstanding Balance</span>
                  <span className="text-amber-800 font-bold">{fmtKES(remaining)}</span>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Amount to be Paid</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">KES</span>
                    <input
                      type="number"
                      value={paymentModal.partialAmount}
                      onChange={e => onUpdate({ ...paymentModal, partialAmount: e.target.value })}
                      max={remaining}
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="w-full border border-gray-200 rounded-lg pl-12 pr-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
              <select
                value={paymentModal.paymentMethod || 'cash'}
                onChange={e => onUpdate({ ...paymentModal, paymentMethod: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex items-center gap-3 flex-shrink-0 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 text-sm font-medium text-gray-600 hover:text-gray-800 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={processing || (paymentModal.paymentType === 'partial' && (!Number(paymentModal.partialAmount) || Number(paymentModal.partialAmount) <= 0))}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Payment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
