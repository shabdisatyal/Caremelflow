import { useMemo } from 'react';
import { deadlineLabel } from '../utils/dates';
import { monthFocus, monthSentence, tagColor } from '../utils/tasks';


export default function ThisMonth({ items }) {
  const groups = useMemo(() => monthFocus(items), [items]);
  return (
    <section className="rounded-3xl border border-[#E6DCC9] bg-white p-6">
      <h2 className="text-xl font-semibold text-[#4A2F20]">Important this month</h2>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-[#7a6a5a]">
          Your tests and deadlines will show up here 
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.tag} className="rounded-2xl p-4" style={{ background: tagColor(g.tag) }}>
              <p className="text-lg font-semibold text-[#4A2F20]">{g.tag}</p>
              <p className="text-sm text-[#4A2F20]">{monthSentence(g)}</p>
              <p className="mt-1 text-xs text-[#4A2F20] opacity-75">Next: {deadlineLabel(g.next)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
