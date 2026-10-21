import { useState, useMemo } from 'react';
import { ITEMS_KEY } from './constants';
import { useStored } from '../hooks/useStored';
import { ymd, dayDiff, parseDate } from '../utils/dates';
import { flattenTasks, isToday, parseQuick } from '../utils/tasks';
import Chip from './ui/Chip';
import { darkBtn, field } from './ui/styles';
import ThisMonth from './ThisMonth';
import TaskList from './TaskList';
import Calendar from './Calendar/Calendar';
import DayModal from './Calendar/DayModal';
import Report from './Report/Report';
import CantStartCard from './CantStart/CantStartCard';
import CantStartFlow from './CantStart/CantStartFlow';

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
    <main className="min-h-screen w-full bg-[var(--bg)] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[var(--text)] opacity-70">
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
                empty="Nothing for today"
                onToggle={toggleItem}
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
            <CantStartCard onOpen={() => setFlowOpen(true)} />
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