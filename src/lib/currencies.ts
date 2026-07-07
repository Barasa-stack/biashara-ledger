export type Currency = {
  code: string;
  name: string;
  symbol: string;
  symbolNative: string;
  decimalDigits: number;
  isDefault?: boolean;
};

export const currencies: Currency[] = [
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', symbolNative: 'KSh', decimalDigits: 2, isDefault: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', symbolNative: '$', decimalDigits: 2 },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', symbolNative: 'USh', decimalDigits: 0 },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', symbolNative: 'TSh', decimalDigits: 0 },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', symbolNative: 'RF', decimalDigits: 0 },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', symbolNative: '₦', decimalDigits: 2 },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', symbolNative: 'R', decimalDigits: 2 },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', symbolNative: '₵', decimalDigits: 2 },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', symbolNative: 'Br', decimalDigits: 2 },
  { code: 'XOF', name: 'West African CFA', symbol: 'CFA', symbolNative: 'CFA', decimalDigits: 0 },
  { code: 'XAF', name: 'Central African CFA', symbol: 'FCFA', symbolNative: 'FCFA', decimalDigits: 0 },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD', symbolNative: 'MAD', decimalDigits: 2 },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', symbolNative: 'E£', decimalDigits: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', symbolNative: '₹', decimalDigits: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', symbolNative: '¥', decimalDigits: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', symbolNative: '¥', decimalDigits: 0 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', symbolNative: 'د.إ', decimalDigits: 2 },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', symbolNative: '﷼', decimalDigits: 2 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', symbolNative: 'Fr', decimalDigits: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', symbolNative: 'A$', decimalDigits: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', symbolNative: 'C$', decimalDigits: 2 },
];

export function getCurrency(code?: string): Currency {
  if (!code) return currencies.find(c => c.isDefault) || currencies[0];
  return currencies.find(c => c.code === code) || currencies.find(c => c.isDefault) || currencies[0];
}

export const defaultCurrency = currencies.find(c => c.isDefault) || currencies[0];

export function formatCurrency(amount: number, currencyCode: string): string {
  const c = getCurrency(currencyCode);
  return `${c.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: c.decimalDigits, maximumFractionDigits: c.decimalDigits })}`;
}

export const PIPELINE_STAGES = [
  { key: 'lead', label: 'Lead', probability: 10 },
  { key: 'qualified', label: 'Qualified', probability: 25 },
  { key: 'proposal', label: 'Proposal', probability: 50 },
  { key: 'negotiation', label: 'Negotiation', probability: 75 },
  { key: 'closed_won', label: 'Closed Won', probability: 100 },
  { key: 'closed_lost', label: 'Closed Lost', probability: 0 },
];

export const ASSET_TYPES = ['Equipment', 'Vehicles', 'Furniture', 'Buildings', 'Land', 'Computers', 'Software', 'Machinery', 'Leasehold Improvements', 'Other'];
export const DEPRECIATION_METHODS = [
  { value: 'straight-line', label: 'Straight Line' },
  { value: 'declining-balance', label: 'Declining Balance' },
];
export const COA_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
];
