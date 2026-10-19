export default function CantStartCard({ onOpen }) {
  return (
    <section className="rounded-3xl bg-[#4A2F20] p-6 text-[#FFFAF3]">
      <h2 className="text-xl font-semibold">I can&apos;t start</h2>
      <p className="mt-3 text-sm leading-relaxed opacity-85">
        Stuck is not a flaw. Tell us what is going on, take five minutes to reset,
        and we will hand you one thing to do next.
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="mt-8 w-full rounded-full bg-[#FBF1D6] px-6 py-4 text-base font-semibold text-[#4A2F20] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFFAF3]"
      >
        I can&apos;t start
      </button>
    </section>
  );
}
