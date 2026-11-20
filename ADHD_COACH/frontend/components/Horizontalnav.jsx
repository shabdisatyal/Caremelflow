import { NavLink, Link, useLocation } from 'react-router-dom';
import { useStudyCtx } from './StudyContext';
import { fmt } from './pages/Usestudy';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/subjects', label: 'Organise' },
  { to: '/flashcard', label: 'Recall' },
  { to: '/study', label: 'Focus' },
  { to: '/manage', label: 'Manage' },
  { to: '/profile', label: 'You' },
];

const PANEL_BORDER = 'color-mix(in srgb, var(--text) 14%, transparent)';
const TITLEBAR_BG = 'color-mix(in srgb, var(--text) 5%, transparent)';

function MiniTimer() {
  const { running, remaining, isFocus } = useStudyCtx();
  const { pathname } = useLocation();

  if (!running || pathname === '/study') return null;

  return (
    <Link
      to="/study"
      className="rounded-full border-2 border-[#4A2F20] bg-[#F6C945] px-3 py-0.5 text-xs font-child tracking-widest text-[#4A2F20] tabular-nums"
    >
      {isFocus ? 'focus' : 'break'} {fmt(remaining)}
    </Link>
  );
}

export function HorizontalNav() {
  return (
    <div className="w-full flex flex-col items-center justify-center pt-4 pb-3 sm:pt-6 sm:pb-4 bg-white">
      {/* Desktop */}
      <nav className="hidden sm:flex w-full flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 text-center">
        {LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'border-b-2 pb-1 text-sm tracking-[0.3em] font-child text-black transition-colors hover:text-black/60 ' +
              (isActive ? 'border-[var(--accent)]' : 'border-transparent')
            }
          >
            {label}
          </NavLink>
        ))}
        <MiniTimer />
      </nav>

      {/* Mobile */}
      <div className="sm:hidden w-full px-4">
        <div
          className="w-full rounded-xl border bg-[var(--panel)] text-[var(--text)] shadow-sm overflow-hidden"
          style={{ borderColor: PANEL_BORDER }}
        >
          <div
            className="flex items-center justify-between h-8 px-3 border-b"
            style={{ background: TITLEBAR_BG, borderColor: PANEL_BORDER }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
            </div>
            <span className="text-[11px] font-child opacity-60">caremelflow</span>
            <div className="min-w-9 flex justify-end">
              <MiniTimer />
            </div>
          </div>

          <nav className="grid grid-cols-3 gap-1.5 p-2.5 text-center">
            {LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  'rounded-lg py-2 px-1 text-xs tracking-[0.14em] font-child transition-colors ' +
                  (isActive
                    ? 'bg-[var(--accent)] text-black font-medium'
                    : 'text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}