
import { ymd, parseDate, dayDiff } from './dates';

import { KIND_WEIGHT, TAG_COLORS } from '../components/constants';


export function flattenTasks(items) {
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

export function isToday(t) {
  return t.today || (t.deadline && dayDiff(t.deadline) === 0);
}

export function pickFocus(tasks) {
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

export function tagColor(tag) {
  let h = 0;
  for (const c of tag.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

// "Finish worksheet #Math" becomes title "Finish worksheet" with tag "Math"
export function parseQuick(text) {
  const m = text.match(/#([^\s#]+)/);
  return {
    title: text.replace(/#([^\s#]+)/, '').replace(/\s+/g, ' ').trim(),
    tag: m ? m[1] : '',
  };
}

// Subjects with a test or deadline left this month, ranked by how heavy they are
export function monthFocus(items) {
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

export function monthSentence(g) {
  const parts = [];
  if (g.tests) parts.push(`${g.tests} ${g.tests === 1 ? 'test' : 'tests'}`);
  if (g.deadlines) parts.push(`${g.deadlines} ${g.deadlines === 1 ? 'deadline' : 'deadlines'}`);
  return parts.join(' and ') + ' this month';
}
