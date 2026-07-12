export function MetricBox({ label, value, suffix, valueColor }: { label: string; value: string; suffix: string; valueColor?: string }) {
  const cls = valueColor === 'green' ? 'text-green-600' : valueColor === 'red' ? 'text-red-600' : 'text-brand';
  return (
    <div className="bg-surface rounded-lg p-4 text-center border border-border">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${cls}`}>{value}<span className="text-sm font-normal text-gray-500">{suffix}</span></p>
    </div>
  );
}
