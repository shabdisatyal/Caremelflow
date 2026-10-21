import { useMemo } from 'react';
import { deadlineLabel } from '../utils/dates';
import { monthFocus, monthSentence, tagColor } from '../utils/tasks';

export default function ThisMonth({ items }) {
  const groups = useMemo(() => monthFocus(items), [items]);
  return (
    <section className="rounded-3xl border border-[color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[var(--panel)] p-6">
      <h2 className="text-xl font-semibold text-[var(--text)]">Important this month</h2>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--text)] opacity-70">
          Your tests and deadlines will show up here
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.tag} className="rounded-2xl p-4" style={{ background: tagColor(g.tag) }}>
              <p className="text-lg font-semibold text-[var(--text)]">{g.tag}</p>
              <p className="text-sm text-[var(--text)]">{monthSentence(g)}</p>
              <p className="mt-1 text-xs text-[var(--text)] opacity-75">Next: {deadlineLabel(g.next)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}