// Complete Country to Currency Mapping
export const COUNTRY_CURRENCY_MAP: Record<string, { code: string; symbol: string; name: string; flag?: string }> = {
  // ===== AFRICA =====
  // East Africa
  KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  UG: { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬' },
  TZ: { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿' },
  RW: { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc', flag: '🇷🇼' },
  BI: { code: 'BIF', symbol: 'FBu', name: 'Burundian Franc', flag: '🇧🇮' },
  SS: { code: 'SSP', symbol: '£', name: 'South Sudanese Pound', flag: '🇸🇸' },
  DJ: { code: 'DJF', symbol: 'Fdj', name: 'Djiboutian Franc', flag: '🇩🇯' },
  ER: { code: 'ERN', symbol: 'Nfk', name: 'Eritrean Nakfa', flag: '🇪🇷' },
  ET: { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', flag: '🇪🇹' },
  SO: { code: 'SOS', symbol: 'Sh', name: 'Somali Shilling', flag: '🇸🇴' },
  
  // Southern Africa
  ZA: { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  ZM: { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha', flag: '🇿🇲' },
  ZW: { code: 'ZWL', symbol: '$', name: 'Zimbabwean Dollar', flag: '🇿🇼' },
  BW: { code: 'BWP', symbol: 'P', name: 'Botswana Pula', flag: '🇧🇼' },
  NA: { code: 'NAD', symbol: '$', name: 'Namibian Dollar', flag: '🇳🇦' },
  LS: { code: 'LSL', symbol: 'L', name: 'Lesotho Loti', flag: '🇱🇸' },
  SZ: { code: 'SZL', symbol: 'E', name: 'Swazi Lilangeni', flag: '🇸🇿' },
  MZ: { code: 'MZN', symbol: 'MT', name: 'Mozambican Metical', flag: '🇲🇿' },
  MW: { code: 'MWK', symbol: 'MK', name: 'Malawian Kwacha', flag: '🇲🇼' },
  AO: { code: 'AOA', symbol: 'Kz', name: 'Angolan Kwanza', flag: '🇦🇴' },
  
  // West Africa
  NG: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  GH: { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  SN: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇸🇳' },
  CI: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇨🇮' },
  ML: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇲🇱' },
  BF: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇧🇫' },
  TG: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇹🇬' },
  BJ: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇧🇯' },
  NE: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇳🇪' },
  GW: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇬🇼' },
  GM: { code: 'GMD', symbol: 'D', name: 'Gambian Dalasi', flag: '🇬🇲' },
  LR: { code: 'LRD', symbol: '$', name: 'Liberian Dollar', flag: '🇱🇷' },
  SL: { code: 'SLL', symbol: 'Le', name: 'Sierra Leonean Leone', flag: '🇸🇱' },
  
  // Central Africa
  CM: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇨🇲' },
  CF: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇨🇫' },
  TD: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇹🇩' },
  CG: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇨🇬' },
  GQ: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇬🇶' },
  GA: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇬🇦' },
  CD: { code: 'CDF', symbol: 'FC', name: 'Congolese Franc', flag: '🇨🇩' },
  
  // North Africa
  EG: { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬' },
  MA: { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', flag: '🇲🇦' },
  DZ: { code: 'DZD', symbol: 'DA', name: 'Algerian Dinar', flag: '🇩🇿' },
  TN: { code: 'TND', symbol: 'DT', name: 'Tunisian Dinar', flag: '🇹🇳' },
  LY: { code: 'LYD', symbol: 'LD', name: 'Libyan Dinar', flag: '🇱🇾' },
  SD: { code: 'SDG', symbol: '£', name: 'Sudanese Pound', flag: '🇸🇩' },
  MR: { code: 'MRU', symbol: 'UM', name: 'Mauritanian Ouguiya', flag: '🇲🇷' },
  
  // ===== AMERICAS =====
  US: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  MX: { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  BR: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  AR: { code: 'ARS', symbol: '$', name: 'Argentine Peso', flag: '🇦🇷' },
  CL: { code: 'CLP', symbol: '$', name: 'Chilean Peso', flag: '🇨🇱' },
  CO: { code: 'COP', symbol: '$', name: 'Colombian Peso', flag: '🇨🇴' },
  PE: { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', flag: '🇵🇪' },
  VE: { code: 'VES', symbol: 'Bs', name: 'Venezuelan Bolívar', flag: '🇻🇪' },
  UY: { code: 'UYU', symbol: '$', name: 'Uruguayan Peso', flag: '🇺🇾' },
  PY: { code: 'PYG', symbol: '₲', name: 'Paraguayan Guarani', flag: '🇵🇾' },
  BO: { code: 'BOB', symbol: 'Bs', name: 'Bolivian Boliviano', flag: '🇧🇴' },
  EC: { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇪🇨' },
  CR: { code: 'CRC', symbol: '₡', name: 'Costa Rican Colón', flag: '🇨🇷' },
  PA: { code: 'PAB', symbol: 'B/.', name: 'Panamanian Balboa', flag: '🇵🇦' },
  DO: { code: 'DOP', symbol: 'RD$', name: 'Dominican Peso', flag: '🇩🇴' },
  JM: { code: 'JMD', symbol: 'J$', name: 'Jamaican Dollar', flag: '🇯🇲' },
  TT: { code: 'TTD', symbol: 'TT$', name: 'Trinidad and Tobago Dollar', flag: '🇹🇹' },
  
  // ===== EUROPE =====
  GB: { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  DE: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇩🇪' },
  FR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇫🇷' },
  IT: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇮🇹' },
  ES: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇸' },
  NL: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇳🇱' },
  BE: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇧🇪' },
  PT: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇵🇹' },
  GR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇬🇷' },
  IE: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇮🇪' },
  AT: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇦🇹' },
  FI: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇫🇮' },
  SE: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  NO: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  DK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  CH: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', flag: '🇨🇭' },
  PL: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  CZ: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  HU: { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
  RO: { code: 'RON', symbol: 'lei', name: 'Romanian Leu', flag: '🇷🇴' },
  BG: { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', flag: '🇧🇬' },
  HR: { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇭🇷' },
  RS: { code: 'RSD', symbol: 'din.', name: 'Serbian Dinar', flag: '🇷🇸' },
  UA: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', flag: '🇺🇦' },
  TR: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  
  // ===== ASIA =====
  CN: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  JP: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  IN: { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  KR: { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  SG: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  MY: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  TH: { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  VN: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  ID: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  PH: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  PK: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰' },
  BD: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', flag: '🇧🇩' },
  LK: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', flag: '🇱🇰' },
  NP: { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', flag: '🇳🇵' },
  AE: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  SA: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦' },
  IL: { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱' },
  KW: { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  QA: { code: 'QAR', symbol: 'QR', name: 'Qatari Riyal', flag: '🇶🇦' },
  OM: { code: 'OMR', symbol: 'RO', name: 'Omani Rial', flag: '🇴🇲' },
  BH: { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', flag: '🇧🇭' },
  LB: { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', flag: '🇱🇧' },
  JO: { code: 'JOD', symbol: 'JD', name: 'Jordanian Dinar', flag: '🇯🇴' },
  IQ: { code: 'IQD', symbol: 'د.ع', name: 'Iraqi Dinar', flag: '🇮🇶' },
  IR: { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', flag: '🇮🇷' },
  AF: { code: 'AFN', symbol: '؋', name: 'Afghan Afghani', flag: '🇦🇫' },
  MM: { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', flag: '🇲🇲' },
  KH: { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', flag: '🇰🇭' },
  LA: { code: 'LAK', symbol: '₭', name: 'Lao Kip', flag: '🇱🇦' },
  MN: { code: 'MNT', symbol: '₮', name: 'Mongolian Tugrik', flag: '🇲🇳' },
  
  // ===== OCEANIA =====
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  NZ: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  PG: { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', flag: '🇵🇬' },
  FJ: { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar', flag: '🇫🇯' },
  SB: { code: 'SBD', symbol: 'SI$', name: 'Solomon Islands Dollar', flag: '🇸🇧' },
  VU: { code: 'VUV', symbol: 'VT', name: 'Vanuatu Vatu', flag: '🇻🇺' },
};

export function getCurrencyForCountry(countryCode: string): { code: string; symbol: string; name: string; flag?: string } {
  if (!countryCode) {
    return { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' };
  }
  const upperCode = countryCode.toUpperCase();
  return COUNTRY_CURRENCY_MAP[upperCode] || { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' };
}

export function getCurrencyCode(countryCode: string): string {
  return getCurrencyForCountry(countryCode).code;
}

export function getCurrencySymbol(countryCode: string): string {
  return getCurrencyForCountry(countryCode).symbol;
}

export function getCurrencyName(countryCode: string): string {
  return getCurrencyForCountry(countryCode).name;
}

export function getCountryFlag(countryCode: string): string {
  return getCurrencyForCountry(countryCode).flag || '🌍';
}

export function getAllCountries(): Array<{ code: string; name: string; currency: string; flag: string }> {
  return Object.entries(COUNTRY_CURRENCY_MAP).map(([code, data]) => ({
    code,
    name: data.name.replace(/\s*\(.*\)$/, ''), // Remove currency name from country name
    currency: data.code,
    flag: data.flag || '🌍',
  })).sort((a, b) => a.name.localeCompare(b.name));
}
