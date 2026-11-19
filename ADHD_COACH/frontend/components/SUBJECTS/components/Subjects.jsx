import { useState, useMemo } from 'react';
import { ITEMS_KEY } from './constants';
import { useStored } from '../hooks/useStored';
import { ymd, dayDiff, parseDate } from '../utils/dates';
import { flattenTasks, isToday } from '../utils/tasks';
import ThisMonth from './ThisMonth';
import TaskList from './TaskList';
import Calendar from './Calendar/Calendar';
import DayModal from './Calendar/DayModal';
import Report from './Report/Report';
import CantStartCard from './CantStart/CantStartCard';
import CantStartFlow from './CantStart/CantStartFlow';

const TABS = [
  ['overview', 'overview'],
  ['calendar', 'calendar'],
  ['report', 'report'],
];

export function Subjects() {
  const [tab, setTab] = useState('overview');
  const [flowOpen, setFlowOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState(null);
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

  const left = todayList.filter((t) => !t.done).length;

  return (
    <main
      className="min-h-screen w-full bg-white font-child px-6 py-14 sm:px-12 sm:py-20"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.2) 1px, transparent 1px)',
        backgroundSize: '38px 38px',
      }}
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-12">
          
          <p className="text-lg text-black/60">
            {left === 0 ? 'nothing left to do today' : `${left} to do today`}
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <nav role="tablist" className="flex flex-wrap gap-2 mb-10">
              {TABS.map(([key, text]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={`rounded-full border-2 border-[#4A2F20] px-5 py-1.5 text-lg transition ${
                    tab === key
                      ? 'bg-[#F6C945] text-[#4A2F20] shadow-[3px_3px_0_#4A2F20]'
                      : 'text-[#4A2F20]/70 hover:bg-[#F6C945]/40'
                  }`}
                >
                  {text}
                </button>
              ))}
            </nav>

            {tab === 'overview' && (
              <div className="space-y-12">
                <ThisMonth items={items} />
                <div className="grid gap-10 md:grid-cols-2">
                  <TaskList
                    title="today’s to do"
                    items={todayList}
                    empty="Nothing for today"
                    onToggle={toggleItem}
                  />
                  <TaskList
                    title="deadlines"
                    items={deadlines}
                    empty="No upcoming deadlines. Open the calendar tab and pick a date to add one."
                    onToggle={toggleItem}
                  />
                </div>
              </div>
            )}

            {tab === 'calendar' && <Calendar items={items} onPick={setPickedDate} />}
            {tab === 'report' && <Report />}
          </div>

          <aside className="lg:col-span-4 lg:sticky lg:top-14 self-start">
            <CantStartCard onOpen={() => setFlowOpen(true)} />
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