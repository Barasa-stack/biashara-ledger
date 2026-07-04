import * as XLSX from 'xlsx';

export type ImportRow = Record<string, string>;

export type ColumnMapping = {
  header: string;
  field: string;
  autoMapped: boolean;
};

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  type?: 'string' | 'email' | 'number' | 'tel';
};

export type ValidationError = {
  row: number;
  field: string;
  message: string;
  value: string;
};

export type ImportResult = {
  imported: number;
  errors: number;
  errorDetails: ValidationError[];
};

export function parseFile(file: File): Promise<{ headers: string[]; rows: ImportRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
        if (json.length === 0) {
          reject(new Error('File is empty'));
          return;
        }
        const headers = Object.keys(json[0]);
        const rows = json.map((r) => {
          const row: Record<string, string> = {};
          for (const key of headers) {
            row[key] = String(r[key] ?? '');
          }
          return row;
        });
        resolve({ headers, rows });
      } catch (err) {
        reject(new Error('Failed to parse file. Ensure it is a valid CSV or Excel file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

const COMMON_ALIASES: Record<string, string[]> = {
  customer_name: ['name', 'customer name', 'customer', 'client name', 'client', 'full name'],
  company_name: ['company', 'company name', 'organisation', 'organization', 'business', 'business name', 'firm'],
  contact_person: ['contact person', 'contact', 'contact name', 'person', 'representative'],
  email_address: ['email', 'e-mail', 'email address', 'mail', 'emailaddress'],
  phone_number: ['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell', 'phone_no', 'phonenumber', 'contact no'],
  billing_address: ['billing address', 'billing', 'address', 'street', 'address1'],
  shipping_address: ['shipping address', 'shipping', 'delivery address', 'delivery', 'address2'],
  tax_id: ['tax id', 'taxid', 'tax', 'vat', 'vat number', 'vat no', 'kra pin', 'kra_pin', 'tin', 'tax identification'],
  payment_terms: ['payment terms', 'terms', 'payment term', 'payment'],
  credit_limit: ['credit limit', 'credit', 'limit', 'creditlimit', 'credit_line'],
  notes: ['notes', 'note', 'remarks', 'comment', 'comments', 'description'],
  supplier_name: ['supplier name', 'supplier', 'vendor', 'vendor name'],
  address: ['address', 'street', 'location', 'full address'],
  bank_details: ['bank details', 'bank', 'bank account', 'account', 'iban'],
  supplier_category: ['supplier category', 'category', 'vendor category', 'type'],
  sku: ['sku', 'stock code', 'part number', 'item code', 'product code'],
  item_name: ['item name', 'item', 'product name', 'product', 'description'],
  unit_of_measure: ['unit', 'uom', 'measure', 'unit of measure', 'measurement'],
  unit_cost: ['unit cost', 'cost', 'price', 'unit price', 'purchase price'],
  current_stock: ['current stock', 'stock', 'quantity', 'qty', 'on hand', 'in stock'],
  category: ['category', 'type', 'class', 'classification'],
};

export function autoDetectMapping(headers: string[], fields: FieldDef[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  const usedFields = new Set<string>();

  for (const header of headers) {
    const h = header.trim().toLowerCase();
    let matched = false;
    for (const field of fields) {
      if (usedFields.has(field.key)) continue;
      const aliases = COMMON_ALIASES[field.key] || [field.key.replace(/_/g, ' ')];
      if (aliases.some((a) => h === a || h.replace(/[\s_-]/g, '') === a.replace(/[\s_-]/g, ''))) {
        mappings.push({ header, field: field.key, autoMapped: true });
        usedFields.add(field.key);
        matched = true;
        break;
      }
    }
    if (!matched) {
      mappings.push({ header, field: '', autoMapped: false });
    }
  }

  for (const field of fields) {
    if (!usedFields.has(field.key)) {
      mappings.push({ header: '', field: field.key, autoMapped: false });
    }
  }

  return mappings;
}

export function validateRows(
  rows: ImportRow[],
  mappings: ColumnMapping[],
  fields: FieldDef[],
  existingEmails: Set<string>,
): { valid: ImportRow[]; errors: ValidationError[] } {
  const valid: ImportRow[] = [];
  const errors: ValidationError[] = [];

  const fileSeenEmails = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowErrors: ValidationError[] = [];
    const mappedRow: ImportRow = {};
    const fieldMap = new Map(mappings.filter((m) => m.field).map((m) => [m.field, m.header]));

    for (const field of fields) {
      const header = fieldMap.get(field.key);
      const value = header ? (row[header] || '').trim() : '';

      if (field.required && !value) {
        rowErrors.push({ row: i + 2, field: field.label, message: `${field.label} is required`, value });
      }

      if (value) {
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            rowErrors.push({ row: i + 2, field: field.label, message: `Invalid email format: "${value}"`, value });
          } else {
            const normalized = value.toLowerCase();
            if (existingEmails.has(normalized)) {
              rowErrors.push({ row: i + 2, field: field.label, message: `Duplicate email: "${value}"`, value });
            } else if (fileSeenEmails.has(normalized)) {
              rowErrors.push({ row: i + 2, field: field.label, message: `Duplicate email in file: "${value}"`, value });
            } else {
              fileSeenEmails.add(normalized);
            }
          }
        }
        if (field.type === 'number') {
          if (isNaN(Number(value))) {
            rowErrors.push({ row: i + 2, field: field.label, message: `Invalid number: "${value}"`, value });
          }
        }
      }

      mappedRow[field.key] = value;
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      valid.push(mappedRow);
    }
  }

  return { valid, errors };
}

export function downloadTemplate(fields: FieldDef[], filename: string) {
  const header = fields.map((f) => f.label).join(',');
  const bom = '\uFEFF';
  const blob = new Blob([bom + header + '\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadErrorReport(errors: ValidationError[], filename: string) {
  const header = 'Row,Field,Value,Error';
  const rows = errors.map((e) => `"${e.row}","${e.field}","${e.value.replace(/"/g, '""')}","${e.message.replace(/"/g, '""')}"`);
  const csv = [header, ...rows].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
