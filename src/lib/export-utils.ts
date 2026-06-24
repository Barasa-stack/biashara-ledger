export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename: string,
) {
  const header = columns.map(c => `"${c.label}"`).join(',');
  const rows = data.map(row =>
    columns.map(c => {
      const val = row[c.key];
      const str = val == null ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','),
  );
  const csv = [header, ...rows].join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export async function exportExcel<T extends Record<string, any>>(
  data: T[],
  columns: { key: string; label: string }[],
  filename: string,
) {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, columns, filename, format: 'xlsx' }),
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  downloadBlob(blob, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export async function exportWord<T extends Record<string, any>>(
  title: string,
  data: T[],
  columns: { key: string; label: string }[],
  filename: string,
) {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, data, columns, filename, format: 'docx' }),
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  downloadBlob(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}

export async function exportPDF(title: string, data: any[], columns: { key: string; label: string }[], filename: string) {
  const res = await fetch('/api/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, data, columns, filename, format: 'pdf' }),
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  downloadBlob(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getDefaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  return { from, to };
}
