export function fmtUSD(n: number | string | null | undefined): string {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function fmtUSDShort(n: number | string | null | undefined): string {
  const num = Number(n || 0);
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
