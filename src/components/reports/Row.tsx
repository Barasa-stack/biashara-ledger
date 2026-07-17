'use client';

export function Row({ label, value, color, fontWeight }: { label: string; value: string; color?: string; fontWeight?: string }) {
  return (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-[#000000]">{label}</span>
      <span className={`${fontWeight || 'font-medium'} ${color || 'text-brand'}`}>{value}</span>
    </div>
  );
}
