export type VatRate = {
  code: string;
  name: string;
  rate: number;
  label: string;
};

export const vatRates: VatRate[] = [
  // East Africa
  { code: 'KE', name: 'Kenya', rate: 16, label: 'VAT' },
  { code: 'UG', name: 'Uganda', rate: 18, label: 'VAT' },
  { code: 'TZ', name: 'Tanzania', rate: 18, label: 'VAT' },
  { code: 'RW', name: 'Rwanda', rate: 18, label: 'VAT' },
  { code: 'BI', name: 'Burundi', rate: 18, label: 'VAT' },
  { code: 'SS', name: 'South Sudan', rate: 18, label: 'VAT' },
  { code: 'ET', name: 'Ethiopia', rate: 15, label: 'VAT' },
  // West Africa
  { code: 'NG', name: 'Nigeria', rate: 7.5, label: 'VAT' },
  { code: 'GH', name: 'Ghana', rate: 12.5, label: 'VAT' },
  { code: 'CI', name: 'Côte d\'Ivoire', rate: 18, label: 'VAT' },
  { code: 'SN', name: 'Senegal', rate: 18, label: 'VAT' },
  { code: 'CM', name: 'Cameroon', rate: 19.25, label: 'VAT' },
  // Southern Africa
  { code: 'ZA', name: 'South Africa', rate: 15, label: 'VAT' },
  { code: 'ZM', name: 'Zambia', rate: 16, label: 'VAT' },
  { code: 'ZW', name: 'Zimbabwe', rate: 14.5, label: 'VAT' },
  { code: 'MW', name: 'Malawi', rate: 16.5, label: 'VAT' },
  { code: 'MZ', name: 'Mozambique', rate: 16, label: 'VAT' },
  { code: 'BW', name: 'Botswana', rate: 14, label: 'VAT' },
  { code: 'NA', name: 'Namibia', rate: 15, label: 'VAT' },
  { code: 'LS', name: 'Lesotho', rate: 15, label: 'VAT' },
  { code: 'SZ', name: 'Eswatini', rate: 15, label: 'VAT' },
  { code: 'AO', name: 'Angola', rate: 14, label: 'VAT' },
  // North Africa
  { code: 'EG', name: 'Egypt', rate: 14, label: 'VAT' },
  { code: 'MA', name: 'Morocco', rate: 20, label: 'VAT' },
  { code: 'TN', name: 'Tunisia', rate: 19, label: 'VAT' },
  { code: 'DZ', name: 'Algeria', rate: 19, label: 'VAT' },
  { code: 'LY', name: 'Libya', rate: 0, label: 'VAT' },
  // Europe
  { code: 'GB', name: 'United Kingdom', rate: 20, label: 'VAT' },
  { code: 'DE', name: 'Germany', rate: 19, label: 'VAT' },
  { code: 'FR', name: 'France', rate: 20, label: 'VAT' },
  { code: 'IT', name: 'Italy', rate: 22, label: 'VAT' },
  { code: 'ES', name: 'Spain', rate: 21, label: 'VAT' },
  { code: 'NL', name: 'Netherlands', rate: 21, label: 'VAT' },
  { code: 'BE', name: 'Belgium', rate: 21, label: 'VAT' },
  { code: 'SE', name: 'Sweden', rate: 25, label: 'VAT' },
  { code: 'DK', name: 'Denmark', rate: 25, label: 'VAT' },
  { code: 'FI', name: 'Finland', rate: 25.5, label: 'VAT' },
  { code: 'AT', name: 'Austria', rate: 20, label: 'VAT' },
  { code: 'IE', name: 'Ireland', rate: 23, label: 'VAT' },
  { code: 'PL', name: 'Poland', rate: 23, label: 'VAT' },
  { code: 'PT', name: 'Portugal', rate: 23, label: 'VAT' },
  { code: 'GR', name: 'Greece', rate: 24, label: 'VAT' },
  { code: 'CH', name: 'Switzerland', rate: 8.1, label: 'VAT' },
  { code: 'NO', name: 'Norway', rate: 25, label: 'VAT' },
  // Americas
  { code: 'US', name: 'United States', rate: 0, label: 'Sales Tax' },
  { code: 'CA', name: 'Canada', rate: 5, label: 'GST' },
  { code: 'MX', name: 'Mexico', rate: 16, label: 'VAT' },
  { code: 'BR', name: 'Brazil', rate: 17, label: 'VAT' },
  { code: 'AR', name: 'Argentina', rate: 21, label: 'VAT' },
  { code: 'CO', name: 'Colombia', rate: 19, label: 'VAT' },
  { code: 'CL', name: 'Chile', rate: 19, label: 'VAT' },
  { code: 'PE', name: 'Peru', rate: 18, label: 'VAT' },
  // Asia & Middle East
  { code: 'AE', name: 'UAE', rate: 5, label: 'VAT' },
  { code: 'SA', name: 'Saudi Arabia', rate: 15, label: 'VAT' },
  { code: 'IN', name: 'India', rate: 18, label: 'GST' },
  { code: 'CN', name: 'China', rate: 13, label: 'VAT' },
  { code: 'JP', name: 'Japan', rate: 10, label: 'Consumption Tax' },
  { code: 'KR', name: 'South Korea', rate: 10, label: 'VAT' },
  { code: 'SG', name: 'Singapore', rate: 9, label: 'GST' },
  { code: 'MY', name: 'Malaysia', rate: 8, label: 'SST' },
  { code: 'TH', name: 'Thailand', rate: 7, label: 'VAT' },
  { code: 'VN', name: 'Vietnam', rate: 10, label: 'VAT' },
  { code: 'PH', name: 'Philippines', rate: 12, label: 'VAT' },
  { code: 'ID', name: 'Indonesia', rate: 11, label: 'VAT' },
  { code: 'PK', name: 'Pakistan', rate: 18, label: 'Sales Tax' },
  { code: 'BD', name: 'Bangladesh', rate: 15, label: 'VAT' },
  { code: 'LK', name: 'Sri Lanka', rate: 18, label: 'VAT' },
  { code: 'HK', name: 'Hong Kong', rate: 0, label: 'N/A' },
  // Oceania
  { code: 'AU', name: 'Australia', rate: 10, label: 'GST' },
  { code: 'NZ', name: 'New Zealand', rate: 15, label: 'GST' },
];

const defaultRate: VatRate = { code: 'XX', name: 'Default', rate: 0, label: 'VAT' };

export function getVatRate(countryCode: string): VatRate {
  if (!countryCode) return defaultRate;
  return vatRates.find(r => r.code === countryCode.toUpperCase()) || defaultRate;
}
