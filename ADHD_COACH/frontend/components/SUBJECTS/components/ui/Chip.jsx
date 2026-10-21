export default function Chip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        'rounded-full border px-4 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button)] ' +
        (selected
          ? 'border-[var(--button)] bg-[var(--button)] text-[var(--ink)]'
          : 'border-[var(--accent)] bg-[var(--panel)] text-[var(--text)] hover:border-[var(--button)]')
      }
    >
      {children}
    </button>
  );
}