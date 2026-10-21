
import { KIND_LABEL } from './constants';
import { deadlineLabel, formatTime } from '../utils/dates';

import TagPill from './ui/TagPill';

export default function TaskList({ title, items, empty, onToggle, footer }) {
  return (
    <section className="rounded-3xl border border-[#E6DCC9] bg-white p-6">
      <h2 className="text-xl font-semibold text-[#4A2F20]">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[#7a6a5a]">{empty}</p>
      ) : (
        <ul className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto pr-1" tabIndex={0} aria-label={`${title} list`}>
          {items.map((t) => (
            <li key={t.source + t.id} className="flex items-start gap-3 border-b border-[#EFE6D6] pb-3 last:border-0 last:pb-0">
              {onToggle && (
                <input
                  type="checkbox"
                  checked={!!t.done}
                  onChange={() => onToggle(t.id)}
                  aria-label={`Mark ${t.text} done`}
                  className="mt-1.5 h-4 w-4 accent-[#3B5B3F]"
                />
              )}
              <div>
                <p className={'text-[#4A2F20] ' + (t.done ? 'line-through opacity-60' : '')}>{t.text}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[#7a6a5a]">
                  <TagPill tag={t.tag} />
                  {t.kind !== 'task' && (
                    <span className="font-medium text-[#3B5B3F]">{KIND_LABEL[t.kind]}</span>
                  )}
                  <span>
                    {[deadlineLabel(t.deadline), t.time && 'at ' + formatTime(t.time)]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {footer}
    </section>
  );
}
