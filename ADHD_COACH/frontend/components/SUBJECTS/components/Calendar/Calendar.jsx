import { useState, useMemo } from 'react';
import { ymd } from '../../utils/dates';
import { quietBtn } from '../ui/styles';

export default function Calendar({ items, onPick }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const offset = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const perDate = useMemo(
    () => items.reduce((a, i) => ({ ...a, [i.date]: (a[i.date] || 0) + 1 }), {}),
    [items]
  );
  const todayStr = ymd(new Date());

  return (
    <section className="rounded-3xl border border-none bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--text)]">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button type="button" className={quietBtn} onClick={() => setCursor(new Date(year, month - 1, 1))}>
            Previous
          </button>
          <button type="button" className={quietBtn} onClick={() => setCursor(new Date(year, month + 1, 1))}>
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-[var(--text)] opacity-60">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={'e' + i} />;
          const date = new Date(year, month, d);
          const key = ymd(date);
          const n = perDate[key] || 0;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onPick(key)}
              aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + (n ? `, ${n} items` : '')}
              className={
                'flex aspect-square flex-col items-center justify-center rounded-2xl text-sm text-[var(--text)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_30%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button)] ' +
                (key === todayStr ? 'bg-[color-mix(in_srgb,var(--accent)_45%,transparent)] font-semibold ' : '') +
                (key < todayStr ? 'opacity-50' : '')
              }
            >
              {d}
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {Array.from({ length: Math.min(n, 3) }).map((_, j) => (
                  <span key={j} className="h-1.5 w-1.5 rounded-full bg-[var(--button)]" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}