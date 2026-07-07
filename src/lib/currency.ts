export function fmtKES(n: number | string | null | undefined): string {
  return `KSh ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function fmtKESShort(n: number | string | null | undefined): string {
  const num = Number(n || 0);
  return `KSh ${num.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
