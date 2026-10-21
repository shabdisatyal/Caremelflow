import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/subjects', label: 'Subjects' },
  { to: '/flashcard', label: 'Recall' },
  { to: '/study', label: 'Study' },
  { to: '/manage', label: 'Manage' },
  { to: '/profile', label: 'Profile' },
];

export function NavButtons() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full font-child flex flex-col items-end pl-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 bg-[var(--button)] text-[var(--ink)] px-5 py-2 rounded-full hover:opacity-90 transition-opacity cursor-pointer mt-6 mr-7 mb-3"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
        <span>{open ? 'Close' : ''}</span>
      </button>

      <div
        className={`w-full overflow-hidden transition-all duration-300 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-none py-6 px-4 flex flex-wrap gap-4 justify-center">
          {NAV_ITEMS.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}>
              <div className="flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--bg)] text-[var(--text)] hover:text-[var(--button)] w-32 h-20 rounded-xl cursor-pointer transition-colors">
                <span className="text-lg font-medium">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}