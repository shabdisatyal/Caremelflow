export default function CantStartCard({ onOpen }) {
  return (
    <section className="rounded-3xl bg-[var(--button)] p-6 text-[var(--ink)]">
      <h2 className="text-xl font-semibold">I can&apos;t start</h2>
      <p className="mt-3 text-sm leading-relaxed opacity-85">
        Stuck is not a flaw. Tell us what is going on, take five minutes to reset,
        and we will hand you one thing to do next.
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-8 w-full rounded-full bg-[var(--bg)] px-6 py-4 text-base font-semibold text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)]"
      >
        I can&apos;t start
      </button>
    </section>
  );
}