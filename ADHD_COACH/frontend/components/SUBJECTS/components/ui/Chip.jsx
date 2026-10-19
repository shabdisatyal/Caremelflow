export default function Chip({ selected, onClick, children }) {
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
