export function MetricBox({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="bg-surface rounded-lg p-4 text-center border border-border">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-brand">{value}<span className="text-sm font-normal text-gray-500">{suffix}</span></p>
    </div>
  );
}
