import { Link, NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/subjects', label: 'Organise' },
  { to: '/flashcard', label: 'Recall' },
  { to: '/study', label: 'Focus' },
  { to: '/manage', label: 'Manage' },
  { to: '/profile', label: 'You' },
];

export function HorizontalNav() {
  return (
    <div className="flex flex-col  pt-6 pb-4">
      <Link to="/">
        <h1 className="titletext font-child text-5xl ml-2 text-[var(--text)]">Caremelflow</h1>
      </Link>

      <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4">
        {LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              'border-b-2 pb-1 text-sm tracking-[0.3em] font-child text-[var(--text)] transition-colors hover:text-[var(--accent)] ' +
              (isActive ? 'border-[var(--accent)]' : 'border-transparent')
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}