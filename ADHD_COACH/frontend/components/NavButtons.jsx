import { NavLink } from 'react-router-dom';
import { BookOpen, Layers, Timer, ListChecks, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/subjects', label: 'Subjects', Icon: BookOpen },
  { to: '/flashcard', label: 'Recall', Icon: Layers },
  { to: '/study', label: 'Study', Icon: Timer },
  { to: '/manage', label: 'Manage', Icon: ListChecks },
  { to: '/profile', label: 'Profile', Icon: User },
];

export function NavButtons() {
  return (
    <nav
      className="fixed inset-x-3 z-50 font-child bg-[var(--accent)] rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] p-3"
      style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <ul className="flex items-center  justify-between max-w-md mx-auto">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 h-11 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-[var(--button)] text-[var(--ink)] px-4'
                    : 'text-[var(--text)] opacity-60 hover:opacity-100 px-3'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} />
                  {isActive && <span className="text-sm font-medium">{label}</span>}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}