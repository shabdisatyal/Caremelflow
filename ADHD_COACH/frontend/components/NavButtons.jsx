import { NavLink } from 'react-router-dom';
import { BookOpen, Layers, Timer, ListChecks, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/subjects',  Icon: BookOpen },
  { to: '/flashcard',  Icon: Layers },
  { to: '/study',  Icon: Timer },
  { to: '/manage', Icon: ListChecks },
  { to: '/profile', Icon: User },
];

const TOP_BORDER = 'color-mix(in srgb, var(--text) 10%, transparent)';

export function NavButtons() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 font-child bg-[var(--panel)] border-t"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        borderColor: TOP_BORDER,
      }}
    >
      <ul className="flex items-stretch justify-around max-w-md mx-auto px-2">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1 flex justify-center">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `group relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 text-xs transition-colors ${
                  isActive
                    ? 'text-[var(--text)] font-medium'
                    : 'text-[var(--text)] opacity-55 hover:opacity-85'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span
                    className={`leading-none pb-1 border-b-2 transition-colors ${
                      isActive ? 'border-[var(--button)]' : 'border-transparent'
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}