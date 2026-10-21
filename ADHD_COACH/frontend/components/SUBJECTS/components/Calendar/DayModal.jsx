import { useState } from 'react';
import { KIND_LABEL } from '../constants';
import { ymd, parseDate, formatTime } from '../../utils/dates';
import ModalShell from '../ui/ModalShell';
import Chip from '../ui/Chip';
import TagPill from '../ui/TagPill';
import { quietBtn, darkBtn, field } from '../ui/styles';

export default function DayModal({ date, items, onAdd, onRemove, onClose }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [tag, setTag] = useState('');
  const [kind, setKind] = useState('task');
  const isPast = date < ymd(new Date());
  const knownTags = [...new Set(items.map((i) => i.tag).filter(Boolean))];
  const dayItems = items
    .filter((i) => i.date === date)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  function submit(e) {
    e.preventDefault();
    if (isPast || !title.trim()) return;
    onAdd({ id: Date.now(), date, time, title: title.trim(), tag: tag.trim(), kind, done: false });
    setTitle('');
    setTime('');
    setTag('');
    setKind('task');
  }

  return (
    <ModalShell label="Day" onClose={onClose}>
      <h2 className="text-2xl font-semibold text-[var(--text)]">
        {parseDate(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </h2>

      {dayItems.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text)] opacity-70">
          {isPast ? 'Nothing was planned.' : 'Nothing planned yet.'}
        </p>
      ) : (
        <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1" tabIndex={0} aria-label="Items on this day">
          {dayItems.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--panel)] px-4 py-3">
              <span className="flex flex-wrap items-center gap-2 text-[var(--text)]">
                {i.time && <span className="text-sm text-[var(--text)] opacity-70">{formatTime(i.time)}</span>}
                {i.title}
                <TagPill tag={i.tag} />
                {i.kind && i.kind !== 'task' && (
                  <span className="text-xs font-medium text-[var(--button)]">{KIND_LABEL[i.kind]}</span>
                )}
              </span>
              {!isPast && (
                <button type="button" onClick={() => onRemove(i.id)} className={quietBtn}>Remove</button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isPast ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--text)] opacity-70">Past days cannot be edited.</p>
          <button type="button" onClick={onClose} className={darkBtn}>Close</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <label className="block text-sm font-medium text-[var(--text)]" htmlFor="ev-title">What is it?</label>
          <input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />

          <p className="text-sm font-medium text-[var(--text)]">Type</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(KIND_LABEL).map(([k, label]) => (
              <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>{label}</Chip>
            ))}
          </div>

          <label className="block text-sm font-medium text-[var(--text)]" htmlFor="ev-tag">Subject tag (optional)</label>
          <input
            id="ev-tag"
            list="subject-tags"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="Math"
            className={field}
          />
          <datalist id="subject-tags">
            {knownTags.map((t) => <option key={t} value={t} />)}
          </datalist>

          <label className="block text-sm font-medium text-[var(--text)]" htmlFor="ev-time">Time (optional)</label>
          <input id="ev-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={onClose} className={quietBtn}>Done</button>
            <button className={darkBtn}>Add</button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}