export const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseDate(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

export function dayDiff(deadline) {
  const d = parseDate(deadline);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

export function deadlineLabel(deadline) {
  if (!deadline) return '';
  const n = dayDiff(deadline);
  if (n < 0) return 'Overdue';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return parseDate(deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
