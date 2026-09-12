// A Month is represented as 'YYYY-MM'. The database stores it as the 1st day
// of that month ('YYYY-MM-01').

export function monthToDate(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error(`invalid month: ${month}`);
  return `${month}-01`;
}

export function dateToMonth(date: string): string {
  return date.slice(0, 7);
}

export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

export function currentMonth(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit' }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  return `${y}-${m}`;
}

export function compareMonths(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
