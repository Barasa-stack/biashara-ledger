'use client';

import { useState, useCallback, useMemo } from 'react';
import { X, Upload, Download, AlertTriangle, CheckCircle, FileSpreadsheet, ArrowLeft, ArrowRight } from 'lucide-react';
import { parseFile, autoDetectMapping, validateRows, downloadTemplate, downloadErrorReport, type ImportRow, type ColumnMapping, type FieldDef, type ValidationError } from '@/lib/import-utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

type Step = 'upload' | 'mapping' | 'preview' | 'result';

interface ImportModalProps {
  title: string;
  fields: FieldDef[];
  apiEndpoint: string;
  existingEmails?: string[];
  onClose: () => void;
  onSuccess: () => void;
  templateFilename: string;
}

export default function ImportModal({ title, fields, apiEndpoint, existingEmails = [], onClose, onSuccess, templateFilename }: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: number; errorDetails: ValidationError[] } | null>(null);
  const [validCount, setValidCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const existingEmailSet = useMemo(() => new Set(existingEmails.map((e) => e.toLowerCase())), [existingEmails]);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError('');

    if (f.size > MAX_FILE_SIZE) {
      setError('File exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setError('Unsupported file format. Please upload CSV or Excel (.xlsx, .xls).');
      return;
    }

    try {
      const parsed = await parseFile(f);
      setFile(f);
      setHeaders(parsed.headers);
      setRows(parsed.rows);

      const detected = autoDetectMapping(parsed.headers, fields);
      setMappings(detected);
      setStep('mapping');
    } catch (err: any) {
      setError(err.message || 'Failed to parse file');
    }
  }, [fields]);

  const updateMapping = useCallback((index: number, field: string) => {
    setMappings((prev) => {
      const next = [...prev];
      const oldField = next[index].field;
      // If user picks a field that's already mapped elsewhere, clear the other
      if (field && oldField !== field) {
        const conflictIdx = next.findIndex((m) => m.field === field && m.header !== next[index].header);
        if (conflictIdx >= 0) {
          next[conflictIdx] = { ...next[conflictIdx], field: '', autoMapped: false };
        }
      }
      next[index] = { ...next[index], field, autoMapped: false };
      return next;
    });
  }, []);

  const previewRows = useMemo(() => {
    const fieldMap = new Map(mappings.filter((m) => m.field).map((m) => [m.field, m.header]));
    return rows.slice(0, 5).map((row) => {
      const mapped: Record<string, string> = {};
      for (const field of fields) {
        const header = fieldMap.get(field.key);
        mapped[field.key] = header ? (row[header] || '') : '';
      }
      return mapped;
    });
  }, [rows, mappings, fields]);

  const handleValidate = useCallback(() => {
    const { valid, errors } = validateRows(rows, mappings, fields, existingEmailSet);
    setValidCount(valid.length);
    setErrorCount(errors.length);
    setStep('preview');
  }, [rows, mappings, fields, existingEmailSet]);

  const handleImport = useCallback(async () => {
    setImporting(true);
    setError('');
    try {
      const { valid } = validateRows(rows, mappings, fields, existingEmailSet);
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: valid,
          mappings: mappings.filter((m) => m.field).map((m) => ({ header: m.header, field: m.field })),
          file_name: file?.name || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');
      setResult(data);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [rows, mappings, fields, existingEmailSet, apiEndpoint, file]);

  const totalUnmapped = mappings.filter((m) => m.field && !m.header).length;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-lg font-bold text-[#000000]">{title}</h2>
              <p className="text-xs text-gray-500">
                {step === 'upload' && 'Upload a CSV or Excel file to bulk import'}
                {step === 'mapping' && 'Map file columns to database fields'}
                {step === 'preview' && `Review ${validCount} valid and ${errorCount} error rows`}
                {step === 'result' && `${result?.imported || 0} records imported`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-brand/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('import-file-input')?.click()}>
                <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-500 mt-1">CSV or Excel files up to 5MB</p>
                <input id="import-file-input" type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
              </div>
              <div className="flex items-center justify-between">
                <button onClick={() => downloadTemplate(fields, templateFilename)} className="flex items-center gap-1.5 text-sm text-brand hover:underline">
                  <Download className="h-4 w-4" /> Download CSV Template
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 'mapping' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {rows.length} rows found in <strong>{file?.name}</strong>. Map columns below.
                {totalUnmapped > 0 && (
                  <span className="text-amber-600"> {totalUnmapped} field(s) not mapped to any column.</span>
                )}
              </p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {mappings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      {m.header ? (
                        <p className="text-sm font-medium text-gray-800 truncate">{m.header}</p>
                      ) : (
                        <p className="text-sm italic text-gray-400">— no matching column —</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
                    <select
                      value={m.field}
                      onChange={(e) => updateMapping(i, e.target.value)}
                      className="w-48 border border-border rounded-lg px-3 py-1.5 text-sm text-[#000000] bg-white"
                    >
                      <option value="">— Skip —</option>
                      {fields.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}{f.required ? ' *' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {rows.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Preview (first 5 rows)</p>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-1.5 text-left font-medium text-gray-500">#</th>
                          {headers.map((h) => (
                            <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 5).map((row, ri) => (
                          <tr key={ri} className="border-t border-border">
                            <td className="px-2 py-1.5 text-gray-400">{ri + 1}</td>
                            {headers.map((h) => (
                              <td key={h} className="px-2 py-1.5 text-gray-700 max-w-[150px] truncate">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Back</button>
                <button onClick={handleValidate} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
                  Validate & Preview
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview Validation */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" /> {validCount} valid
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4" /> {errorCount} errors
                  </div>
                )}
              </div>

              {validCount > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Valid Rows (first {Math.min(validCount, 5)} shown)</p>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-2 py-1.5 text-left font-medium text-gray-500">#</th>
                          {mappings.filter((m) => m.field).map((m) => (
                            <th key={m.field} className="px-2 py-1.5 text-left font-medium text-gray-500">{fields.find((f) => f.key === m.field)?.label || m.field}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.slice(0, 5).map((row, ri) => (
                          <tr key={ri} className="border-t border-border">
                            <td className="px-2 py-1.5 text-gray-400">{ri + 1}</td>
                            {mappings.filter((m) => m.field).map((m) => (
                              <td key={m.field} className="px-2 py-1.5 text-gray-700 max-w-[150px] truncate">{row[m.field]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {errorCount > 0 && (
                <button onClick={() => {
                  const { errors: allErrors } = validateRows(rows, mappings, fields, existingEmailSet);
                  downloadErrorReport(allErrors, `import-errors-${Date.now()}.csv`);
                }} className="flex items-center gap-1.5 text-sm text-red-600 hover:underline">
                  <Download className="h-4 w-4" /> Download Error Report
                </button>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setStep('mapping')} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Back</button>
                <button onClick={handleImport} disabled={validCount === 0 || importing}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50 transition-colors">
                  {importing ? 'Importing...' : `Import ${validCount} Records`}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && result && (
            <div className="space-y-4 text-center py-4">
              {result.errors === 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-700">Import Complete</p>
                  <p className="text-sm text-gray-600">{result.imported} record(s) imported successfully.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                  </div>
                  <p className="text-lg font-bold text-amber-700">Import Completed with Errors</p>
                  <p className="text-sm text-gray-600">{result.imported} imported, {result.errors} skipped.</p>
                  {result.errorDetails.length > 0 && (
                    <button onClick={() => downloadErrorReport(result.errorDetails, `import-errors-${Date.now()}.csv`)}
                      className="flex items-center gap-1.5 text-sm text-red-600 hover:underline mt-2">
                      <Download className="h-4 w-4" /> Download Error Report
                    </button>
                  )}
                </div>
              )}
              <button onClick={() => { onSuccess(); onClose(); }} className="mt-4 px-6 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand/90 transition-colors">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
