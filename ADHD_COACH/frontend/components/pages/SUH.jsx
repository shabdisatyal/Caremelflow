import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseclient'; // match the path you use in Profile.jsx

/*
  CALENDAR ITEM SHAPE (stored in localStorage for now):
  { id, date: 'YYYY-MM-DD', time: 'HH:MM' | '', title, tag: 'Math' | '', kind: 'task' | 'deadline' | 'test', done }

  SUPABASE TABLES: focus_sessions (already exists) and cant_start_logs (create with the SQL provided).
  Both need columns user_id and created_at, with row level security scoping rows to the user.
*/

const ITEMS_KEY = 'caremel_calendar_items';
const RESET_SECONDS = 300;
const SHOWED_UP_WINDOW_MS = 6 * 60 * 60 * 1000;

const MOODS = ['Overwhelmed', 'Anxious', 'Tired', 'Bored', 'Frozen', 'Low'];
const REASONS = [
  'I do not know where to begin',
  'It feels too big',
  'I am too tired',
  'I keep getting distracted',
  'I am afraid of doing it badly',
  'I just do not feel like it',
];
const TIPS = {
  'I do not know where to begin': 'Open it and write down only the first step. Nothing else.',
  'It feels too big': 'Do the first two minutes of it. You can stop after that.',
  'I am too tired': 'Pick the smallest version of this and give it five minutes.',
  'I keep getting distracted': 'Put your phone out of reach, then start the timer.',
  'I am afraid of doing it badly': 'Aim for a messy first pass. You will fix it later.',
  'I just do not feel like it': 'You do not need to feel ready. Start for two minutes.',
};

// Solid backdrop behind every popup. Change this one value to recolor them all.
const OVERLAY_COLOR = '#B0C4D4';

const KIND_LABEL = { task: 'Task', deadline: 'Deadline', test: 'Test' };
const KIND_WEIGHT = { task: 1, deadline: 2, test: 3 };
const TAG_COLORS = ['#EFDCC8', '#C2D4DC', '#CEE2C6', '#EDD9E0', '#D9D1EE'];

/* ---------- storage and dates ---------- */

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable. Replace with a call to your FastAPI backend.
  }
}

async function fetchRange(table, columns, sinceMs, uid) {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq('user_id', uid)
    .gte('created_at', new Date(sinceMs).toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function saveCheckIn({ mood, reasons, energy, note }) {
  const { error } = await supabase
    .from('cant_start_logs')
    .insert({ mood, reasons, energy, note: note || null });
  if (error) console.error('Failed to save check in:', error);
}

function useStored(key) {
  const [value, setValue] = useState(() => readJson(key));
  useEffect(() => writeJson(key, value), [key, value]);
  return [value, setValue];
}

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseDate(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

function dayDiff(deadline) {
  const d = parseDate(deadline);
  const now = new Date();
  d.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.round((d - now) / 86400000);
}

function deadlineLabel(deadline) {
  if (!deadline) return '';
  const n = dayDiff(deadline);
  if (n < 0) return 'Overdue';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  return parseDate(deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/* ---------- tasks ---------- */

function flattenTasks(items) {
  const todayStr = ymd(new Date());
  return items.map((i) => ({
    id: i.id,
    text: i.title,
    deadline: i.date,
    time: i.time,
    today: i.date === todayStr,
    done: i.done,
    tag: i.tag || '',
    kind: i.kind || 'task',
    source: 'calendar',
  }));
}

function isToday(t) {
  return t.today || (t.deadline && dayDiff(t.deadline) === 0);
}

function pickFocus(tasks) {
  const sorted = tasks
    .filter((t) => !t.done && dayDiff(t.deadline) >= 0)
    .sort(
      (a, b) =>
        parseDate(a.deadline) - parseDate(b.deadline) || KIND_WEIGHT[b.kind] - KIND_WEIGHT[a.kind]
    );
  if (!sorted.length) return null;
  const task = sorted[0];
  const why =
    task.kind === 'test'
      ? 'Your nearest test'
      : task.kind === 'deadline'
      ? 'Your nearest deadline'
      : dayDiff(task.deadline) <= 0
      ? 'On your list for today'
      : 'Next on your list';
  return { task, why };
}

function tagColor(tag) {
  let h = 0;
  for (const c of tag.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

// "Finish worksheet #Math" becomes title "Finish worksheet" with tag "Math"
function parseQuick(text) {
  const m = text.match(/#([^\s#]+)/);
  return {
    title: text.replace(/#([^\s#]+)/, '').replace(/\s+/g, ' ').trim(),
    tag: m ? m[1] : '',
  };
}

// Subjects with a test or deadline left this month, ranked by how heavy they are
function monthFocus(items) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const groups = {};
  items.forEach((i) => {
    const kind = i.kind || 'task';
    if (i.done || !i.tag || kind === 'task') return;
    const d = parseDate(i.date);
    if (d.getFullYear() !== today.getFullYear() || d.getMonth() !== today.getMonth() || d < today) return;
    const g = (groups[i.tag.toLowerCase()] ||= { tag: i.tag, tests: 0, deadlines: 0, score: 0, next: i.date });
    if (kind === 'test') g.tests += 1;
    else g.deadlines += 1;
    g.score += KIND_WEIGHT[kind];
    if (d < parseDate(g.next)) g.next = i.date;
  });
  return Object.values(groups)
    .sort((a, b) => b.score - a.score || parseDate(a.next) - parseDate(b.next))
    .slice(0, 4);
}

function monthSentence(g) {
  const parts = [];
  if (g.tests) parts.push(`${g.tests} ${g.tests === 1 ? 'test' : 'tests'}`);
  if (g.deadlines) parts.push(`${g.deadlines} ${g.deadlines === 1 ? 'deadline' : 'deadlines'}`);
  return parts.join(' and ') + ' this month';
}

/* ---------- report ---------- */

async function buildReport(days) {
  const perDay = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      key: ymd(d),
      short: d.toLocaleDateString(undefined, { weekday: 'short' }),
      long: d.toLocaleDateString(undefined, { weekday: 'long' }),
      minutes: 0,
    };
  });
  const since = parseDate(perDay[0].key).getTime();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error('You are signed out.');

  const sessionRows = await fetchRange('focus_sessions', 'duration_minutes, created_at', since, uid);
  // If the check in table is missing, still build the report from sessions alone.
  const logRows = await fetchRange('cant_start_logs', 'reasons, energy, created_at', since, uid).catch(
    (err) => {
      console.error('Could not load check ins:', err);
      return [];
    }
  );
  const sessions = sessionRows.map((s) => ({ at: s.created_at, minutes: s.duration_minutes }));
  const logs = logRows.map((l) => ({ at: l.created_at, reasons: l.reasons || [], energy: l.energy }));

  sessions.forEach((s) => {
    const slot = perDay.find((p) => p.key === ymd(new Date(s.at)));
    if (slot) slot.minutes += s.minutes;
  });

  const total = sessions.reduce((sum, s) => sum + s.minutes, 0);

  // A session counts as "showed up anyway" if it followed a can't start check in within 6 hours.
  const showedUp = sessions.filter((s) => {
    const t = new Date(s.at).getTime();
    return logs.some((l) => {
      const lt = new Date(l.at).getTime();
      return lt <= t && t <= lt + SHOWED_UP_WINDOW_MS;
    });
  });

  const insights = [];
  if (showedUp.length) {
    const longest = Math.max(...showedUp.map((s) => s.minutes));
    insights.push(
      `You showed up for a ${longest} min focus session even when you did not feel like it.`
    );
    if (showedUp.length > 1) {
      insights.push(`That happened ${showedUp.length} times in this period. Starting while stuck is the hard part, and you did it.`);
    }
  }
  if (sessions.length) {
    insights.push(`You focused for ${total} minutes across ${sessions.length} sessions.`);
    const best = perDay.reduce((a, b) => (b.minutes > a.minutes ? b : a));
    if (best.minutes > 0) insights.push(`${best.long} was your strongest day, with ${best.minutes} minutes.`);
  }
  if (logs.length) {
    const counts = {};
    logs.forEach((l) => l.reasons.forEach((r) => (counts[r] = (counts[r] || 0) + 1)));
    const [topReason] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    insights.push(`What got in your way most often: ${topReason.toLowerCase()}.`);
    const avg = (logs.reduce((s, l) => s + l.energy, 0) / logs.length).toFixed(1);
    insights.push(`Your average energy when you felt stuck was ${avg} out of 5.`);
  }
  return { days, perDay, total, count: sessions.length, insights };
}

/* ---------- shared UI ---------- */

function ModalShell({ label, children, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: OVERLAY_COLOR }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-[#FFFAF3] p-6 shadow-xl sm:p-8"
      >
        {children}
      </div>
    </div>
  );
}

function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        'rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5B3F] ' +
        (selected
          ? 'border-[#3B5B3F] bg-[#3B5B3F] text-[#FFFAF3]'
          : 'border-[#D9CDB8] bg-white text-[#4A2F20] hover:border-[#3B5B3F]')
      }
    >
      {children}
    </button>
  );
}

const quietBtn = 'rounded-full px-4 py-2 text-sm text-[#7a6a5a] hover:text-[#4A2F20]';
const darkBtn = 'rounded-full bg-[#4A2F20] px-6 py-3 text-sm font-medium text-[#FFFAF3]';
const field =
  'w-full rounded-2xl border border-[#D9CDB8] bg-white px-4 py-3 text-[#4A2F20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5B3F]';

/* ---------- I can't start flow ---------- */

function LogStep({ onSubmit, onClose }) {
  const [mood, setMood] = useState('');
  const [reasons, setReasons] = useState([]);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');

  const toggle = (r) =>
    setReasons((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  return (
    <ModalShell label="Check in" onClose={onClose}>
      <h2 className="text-2xl font-semibold text-[#4A2F20]">Let us check in first</h2>
      <p className="mt-1 text-sm text-[#7a6a5a]">No wrong answers. This takes under a minute.</p>

      <p className="mt-6 text-sm font-medium text-[#4A2F20]">How are you feeling?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <Chip key={m} selected={mood === m} onClick={() => setMood(m)}>{m}</Chip>
        ))}
      </div>

      <p className="mt-6 text-sm font-medium text-[#4A2F20]">What is making it hard to start?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {REASONS.map((r) => (
          <Chip key={r} selected={reasons.includes(r)} onClick={() => toggle(r)}>{r}</Chip>
        ))}
      </div>

      <label className="mt-6 block text-sm font-medium text-[#4A2F20]" htmlFor="energy">
        Energy right now: {energy} of 5
      </label>
      <input
        id="energy" type="range" min="1" max="5" value={energy}
        onChange={(e) => setEnergy(Number(e.target.value))}
        className="mt-2 w-full accent-[#3B5B3F]"
      />

      <label className="mt-6 block text-sm font-medium text-[#4A2F20]" htmlFor="note">
        Anything else? (optional)
      </label>
      <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={'mt-2 ' + field} />

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className={quietBtn}>Not now</button>
        <button
          type="button"
          disabled={!mood || reasons.length === 0}
          onClick={() => onSubmit({ mood, reasons, energy, note })}
          className={darkBtn + ' disabled:opacity-40'}
        >
          Save and take 5 minutes
        </button>
      </div>
    </ModalShell>
  );
}

function ResetStep({ onDone }) {
  const [left, setLeft] = useState(RESET_SECONDS);
  const [started, setStarted] = useState(false);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 50);
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (left <= 0) onDone();
  }, [left, onDone]);

  // 10 second cycle: inhale 4s, exhale 6s
  const inhale = (RESET_SECONDS - left) % 10 < 4;

  return (
    <ModalShell label="Breathing reset">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-2xl font-semibold text-[#4A2F20]">Breathe. You have time.</h2>
        <div className="relative my-8 flex h-56 w-56 items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute h-56 w-56 rounded-full bg-[#B0C4D4]"
            style={{
              transform: `scale(${started && inhale ? 1 : 0.6})`,
              transition: reduceMotion ? 'none' : `transform ${inhale ? 4 : 6}s ease-in-out`,
            }}
          />
          <p className="relative text-xl font-medium text-[#4A2F20]" aria-live="polite">
            {inhale ? 'Breathe in' : 'Breathe out'}
          </p>
        </div>
        <p className="text-3xl font-semibold tabular-nums text-[#3B5B3F]">
          {pad(Math.floor(left / 60))}:{pad(left % 60)}
        </p>
        <button type="button" onClick={onDone} className={'mt-6 ' + quietBtn}>
          I feel ready, skip the rest
        </button>
      </div>
    </ModalShell>
  );
}

function FocusStep({ focus, tip, onClose }) {
  const navigate = useNavigate();
  return (
    <ModalShell label="Your one thing" onClose={onClose}>
      <h2 className="text-2xl font-semibold text-[#4A2F20]">Here is your one thing</h2>
      {focus ? (
        <div className="mt-5 rounded-2xl bg-[#3B5B3F] p-5 text-[#FFFAF3]">
          <p className="text-sm opacity-80">{focus.why}</p>
          <p className="mt-1 text-xl font-semibold">{focus.task.text}</p>
          <p className="mt-2 text-sm opacity-80">
            {[
              focus.task.tag,
              focus.task.kind !== 'task' && KIND_LABEL[focus.task.kind],
              deadlineLabel(focus.task.deadline),
            ]
              .filter(Boolean)
              .join(', ')}
            {focus.task.time ? ' at ' + formatTime(focus.task.time) : ''}
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-white p-5 text-[#4A2F20]">
          Nothing is waiting on you. Add something to your calendar when you are ready.
        </p>
      )}
      {tip && <p className="mt-4 text-sm text-[#7a6a5a]">{tip}</p>}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className={quietBtn}>Close</button>
        {focus && (
          <button type="button" onClick={() => navigate('/study')} className={darkBtn}>
            Start a 5 minute focus
          </button>
        )}
      </div>
    </ModalShell>
  );
}

function CantStartFlow({ tasks, onClose }) {
  const [step, setStep] = useState('log');
  const [entry, setEntry] = useState(null);
  const focus = useMemo(() => pickFocus(tasks), [tasks]);

  if (step === 'log') {
    return (
      <LogStep
        onClose={onClose}
        onSubmit={(data) => {
          saveCheckIn(data);
          setEntry(data);
          setStep('reset');
        }}
      />
    );
  }
  if (step === 'reset') return <ResetStep onDone={() => setStep('focus')} />;
  return <FocusStep focus={focus} tip={entry ? TIPS[entry.reasons[0]] : ''} onClose={onClose} />;
}

/* ---------- calendar ---------- */

function Calendar({ items, onPick }) {
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
    <section className="rounded-3xl border border-[#E6DCC9] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#4A2F20]">
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

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-[#7a6a5a]">
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
                'flex aspect-square flex-col items-center justify-center rounded-2xl text-sm text-[#4A2F20] transition-colors hover:bg-[#EFE6D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5B3F] ' +
                (key === todayStr ? 'bg-[#B0C4D4] font-semibold ' : '') + (key < todayStr ? 'opacity-50' : '')
              }
            >
              {d}
              <span className="mt-0.5 flex h-1.5 gap-0.5">
                {Array.from({ length: Math.min(n, 3) }).map((_, j) => (
                  <span key={j} className="h-1.5 w-1.5 rounded-full bg-[#3B5B3F]" />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function DayModal({ date, items, onAdd, onRemove, onClose }) {
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
      <h2 className="text-2xl font-semibold text-[#4A2F20]">
        {parseDate(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </h2>

      {dayItems.length === 0 ? (
        <p className="mt-4 text-sm text-[#7a6a5a]">{isPast ? 'Nothing was planned.' : 'Nothing planned yet.'}</p>
      ) : (
        <ul className="mt-4 max-h-60 space-y-2 overflow-y-auto pr-1" tabIndex={0} aria-label="Items on this day">
          {dayItems.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
              <span className="flex flex-wrap items-center gap-2 text-[#4A2F20]">
                {i.time && <span className="text-sm text-[#7a6a5a]">{formatTime(i.time)}</span>}
                {i.title}
                <TagPill tag={i.tag} />
                {i.kind && i.kind !== 'task' && (
                  <span className="text-xs font-medium text-[#3B5B3F]">{KIND_LABEL[i.kind]}</span>
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
          <p className="text-sm text-[#7a6a5a]">Past days cannot be edited.</p>
          <button type="button" onClick={onClose} className={darkBtn}>Close</button>
        </div>
      ) : (
      <form onSubmit={submit} className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-[#4A2F20]" htmlFor="ev-title">What is it?</label>
        <input id="ev-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />

        <p className="text-sm font-medium text-[#4A2F20]">Type</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(KIND_LABEL).map(([k, label]) => (
            <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>{label}</Chip>
          ))}
        </div>

        <label className="block text-sm font-medium text-[#4A2F20]" htmlFor="ev-tag">Subject tag (optional)</label>
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

        <label className="block text-sm font-medium text-[#4A2F20]" htmlFor="ev-time">Time (optional)</label>
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

/* ---------- lists and report ---------- */

function TagPill({ tag }) {
  if (!tag) return null;
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-[#4A2F20]"
      style={{ background: tagColor(tag) }}
    >
      {tag}
    </span>
  );
}

function ThisMonth({ items }) {
  const groups = useMemo(() => monthFocus(items), [items]);
  return (
    <section className="rounded-3xl border border-[#E6DCC9] bg-white p-6">
      <h2 className="text-xl font-semibold text-[#4A2F20]">Important this month</h2>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-[#7a6a5a]">
          Add a test or deadline with a subject tag and that subject will show up here.
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

function TaskList({ title, items, empty, onToggle, footer }) {
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

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.minutes), 1);
  const label = data.map((d) => `${d.short} ${d.minutes} minutes`).join(', ');
  return (
    <div>
      <div role="img" aria-label={'Focus minutes per day: ' + label} className="flex h-32 items-end gap-1">
        {data.map((d) => (
          <div key={d.key} title={`${d.short}: ${d.minutes} min`} className="flex h-full flex-1 flex-col justify-end">
            <div
              className="rounded-t bg-[#3B5B3F]"
              style={{ height: `${(d.minutes / max) * 100}%`, minHeight: d.minutes ? 4 : 0 }}
            />
          </div>
        ))}
      </div>
      {data.length <= 7 ? (
        <div className="mt-1 flex gap-1 text-[10px] text-[#7a6a5a]">
          {data.map((d) => (
            <span key={d.key} className="flex-1 text-center">{d.short}</span>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex justify-between text-[10px] text-[#7a6a5a]">
          <span>{data[0].key.slice(5)}</span>
          <span>{data[data.length - 1].key.slice(5)}</span>
        </div>
      )}
    </div>
  );
}

function Report() {
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  async function generate() {
    const id = ++requestId.current;
    setOpen(true);
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const result = await buildReport(days);
      if (id === requestId.current) setReport(result);
    } catch (err) {
      console.error('Failed to build report:', err);
      if (id === requestId.current) {
        setError(`Could not build the report: ${err.message || 'unknown error'}`);
      }
    }
    if (id === requestId.current) setLoading(false);
  }

  // Closing also cancels any report still loading
  function close() {
    requestId.current += 1;
    setOpen(false);
    setLoading(false);
    setReport(null);
    setError('');
  }

  function pickDays(n) {
    setDays(n);
    if (open) close();
  }

  return (
    <section className="rounded-3xl border border-[#E6DCC9] bg-white p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#4A2F20]">Progress report</h2>
          <p className="text-sm text-[#7a6a5a]">What you actually did, not what you missed.</p>
        </div>
        {open && (
          <button
            type="button"
            onClick={close}
            aria-label="Close report"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F4EEE2] text-[#4A2F20] hover:bg-[#EFE6D6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5B3F]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip selected={days === 7} onClick={() => pickDays(7)}>Last 7 days</Chip>
        <Chip selected={days === 30} onClick={() => pickDays(30)}>Last 30 days</Chip>
      </div>

      {!open && (
        <button type="button" onClick={generate} className={'mt-4 ' + darkBtn}>
          Generate report
        </button>
      )}

      {open && loading && <p className="mt-6 text-sm text-[#7a6a5a]">Loading...</p>}
      {open && error && <p className="mt-6 text-sm font-medium text-red-600">{error}</p>}

      {open && report && (
        <div className="mt-6">
          <BarChart data={report.perDay} />
          {report.insights.length ? (
            <ul
              className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1"
              tabIndex={0}
              aria-label="Report highlights"
            >
              {report.insights.map((line) => (
                <li key={line} className="rounded-2xl bg-[#F4EEE2] px-4 py-3 text-sm text-[#4A2F20]">
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-[#7a6a5a]">
              Nothing to report yet. Finish a focus session and check back.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- page ---------- */

export function Subjects() {
  const [flowOpen, setFlowOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(true);
  const [pickedDate, setPickedDate] = useState(null);
  const [quick, setQuick] = useState('');
  const [items, setItems] = useStored(ITEMS_KEY);

  const tasks = useMemo(() => flattenTasks(items), [items]);
  const todayList = useMemo(
    () =>
      tasks
        .filter(isToday)
        .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')),
    [tasks]
  );
  const deadlines = useMemo(
    () =>
      tasks
        .filter((t) => !t.done && t.deadline && dayDiff(t.deadline) > 0)
        .sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline)),
    [tasks]
  );

  const addItem = (item) => item.date >= ymd(new Date()) && setItems((p) => [...p, item]);
  const removeItem = (id) =>
    setItems((p) => p.filter((i) => i.id !== id || i.date < ymd(new Date())));
  const toggleItem = (id) => setItems((p) => p.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  function addQuick(e) {
    e.preventDefault();
    const { title, tag } = parseQuick(quick);
    if (!title) return;
    addItem({ id: Date.now(), date: ymd(new Date()), time: '', title, tag, kind: 'task', done: false });
    setQuick('');
  }

  return (
    <main className="min-h-screen w-full bg-[#F4EEE2] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-[#4A2F20]">Today</h1>
            <p className="text-[#7a6a5a]">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Chip selected={showCalendar} onClick={() => setShowCalendar((v) => !v)}>
            {showCalendar ? 'Hide calendar' : 'Show calendar'}
          </Chip>
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <ThisMonth items={items} />
            {showCalendar && <Calendar items={items} onPick={setPickedDate} />}

            <div className="grid gap-6 md:grid-cols-2">
              <TaskList
                title="Today's to do"
                items={todayList}
                empty="Nothing for today yet. Add one small thing."
                onToggle={toggleItem}
                footer={
                  <form onSubmit={addQuick} className="mt-4 flex gap-2">
                    <input
                      value={quick}
                      onChange={(e) => setQuick(e.target.value)}
                      placeholder="Add to today, e.g. worksheet #Math"
                      aria-label="Add to today"
                      className={field}
                    />
                    <button className={darkBtn}>Add</button>
                  </form>
                }
              />
              <TaskList
                title="To do deadlines"
                items={deadlines}
                empty="No upcoming deadlines. Pick a date on the calendar to add one."
                onToggle={toggleItem}
              />
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <section className="rounded-3xl bg-[#4A2F20] p-6 text-[#FFFAF3]">
              <h2 className="text-xl font-semibold">I can&apos;t start</h2>
              <p className="mt-3 text-sm leading-relaxed opacity-85">
                Stuck is not a flaw. Tell us what is going on, take five minutes to reset,
                and we will hand you one thing to do next.
              </p>
              <button
                type="button"
                onClick={() => setFlowOpen(true)}
                className="mt-8 w-full rounded-full bg-[#FBF1D6] px-6 py-4 text-base font-semibold text-[#4A2F20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFAF3]"
              >
                I can&apos;t start
              </button>
            </section>
            <Report />
          </aside>
        </div>
      </div>

      {pickedDate && (
        <DayModal
          date={pickedDate}
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          onClose={() => setPickedDate(null)}
        />
      )}
      {flowOpen && <CantStartFlow tasks={tasks} onClose={() => setFlowOpen(false)} />}
    </main>
  );
}

export default Subjects;