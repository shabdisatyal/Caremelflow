import { useEffect } from "react";
import { BACKGROUNDS, fmt, useStudy } from "./Usestudy";

const YELLOW = "#F6C945";
const BLUE = "#BBD5DA";
const BROWN = "#4A2F20";

const label = "text-black/60 text-xs uppercase tracking-wide";
const btn = "-rotate-1 rounded-full border-[3px] border-[#4A2F20] bg-[#F6C945] px-8 py-2.5 text-xl font-child tracking-widest text-[#4A2F20] shadow-[4px_4px_0_#4A2F20] transition-all hover:rotate-1 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#4A2F20] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-60 disabled:pointer-events-none cursor-pointer";
const stepBtn = "w-8 h-8 rounded-full border-2 border-black/20 hover:border-black transition-colors";

// Mac-style popup: cream panel, traffic lights, click outside to close
function Popup({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center px-4 bg-black/20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm max-h-[90vh] flex flex-col bg-[rgb(254,249,233)] text-black border border-black/10 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 h-10 px-4 bg-black/5 border-b border-black/10 shrink-0">
          <button onClick={onClose} aria-label="Close" className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <div className="p-8 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Study() {
  const {
    settings, set, showSettings, setShowSettings, bgOpt,
    totalFocus, totalBreak, phases, phaseIndex, isFocus,
    remaining, running, finished, inProgress, progress,
    toggleRun, reset, toast,
  } = useStudy();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowSettings(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setShowSettings]);

  const ink = bgOpt.dark ? "var(--bg)" : "var(--text)";
  const dot = `color-mix(in srgb, ${ink} 20%, transparent)`;

  // timer ring
  const R = 88;
  const C = 2 * Math.PI * R;

  return (
    <div
      className="min-h-screen w-full flex flex-col font-child transition-colors duration-500"
      style={{
        background: bgOpt.bg,
        color: ink,
        backgroundImage: `radial-gradient(circle, ${dot} 1px, transparent 1px)`,
        backgroundSize: "38px 38px",
      }}
    >
      <header className="flex items-center justify-between w-full max-w-4xl mx-auto px-4 pt-14">
       
        <button
          onClick={() => setShowSettings(true)}
          className="rounded-full border-2 px-5 py-1.5 text-lg transition-colors hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)] border-[color-mix(in_srgb,currentColor_40%,transparent)]"
        >
          settings
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 pb-16">
        <p className="text-2xl opacity-70">
          {finished ? "session complete" : isFocus ? "focus" : "break"}
        </p>

        <div className="relative w-72 h-72">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r={R} fill="none" stroke={ink} strokeOpacity="0.15" strokeWidth="10" />
            <circle
              cx="100" cy="100" r={R} fill="none"
              stroke={isFocus ? YELLOW : BLUE}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-7xl tabular-nums">
            {fmt(remaining)}
          </div>
        </div>

        <div className="flex gap-1.5" aria-label="Session progress">
          {phases.map((p, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full"
              style={{
                width: p.type === "focus" ? 28 : 14,
                background: p.type === "focus" ? YELLOW : BLUE,
                opacity: i < phaseIndex || finished ? 1 : i === phaseIndex ? 0.75 : 0.3,
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button onClick={toggleRun} className={btn}>
            {finished ? "start again" : running ? "pause" : inProgress ? "resume" : "start"}
          </button>
          <button
            onClick={() => reset(true)}
            disabled={!inProgress}
            className="text-xl opacity-70 hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none transition-opacity"
          >
            end session
          </button>
        </div>
      </main>

      {showSettings && (
        <Popup onClose={() => setShowSettings(false)}>
          <h2 className="text-2xl tracking-tight leading-none mb-8">settings</h2>

          <fieldset disabled={inProgress} className="flex flex-col gap-6 disabled:opacity-50">
            <label className="block">
              <div className="flex justify-between items-baseline">
                <span className={label}>Focus length</span>
                <span className="text-lg">{settings.focus} min</span>
              </div>
              <input
                type="range" min="5" max="90" step="5"
                value={settings.focus}
                onChange={(e) => set("focus", Number(e.target.value))}
                className="w-full mt-2"
                style={{ accentColor: BROWN }}
              />
            </label>

            <div className="flex items-center justify-between">
              <span className={label}>Breaks</span>
              <div className="flex items-center gap-3">
                <button aria-label="Fewer breaks" onClick={() => set("breaks", Math.max(0, settings.breaks - 1))} className={stepBtn}>-</button>
                <span className="w-4 text-center text-lg">{settings.breaks}</span>
                <button aria-label="More breaks" onClick={() => set("breaks", Math.min(6, settings.breaks + 1))} className={stepBtn}>+</button>
              </div>
            </div>

            <label className="block">
              <div className="flex justify-between items-baseline">
                <span className={label}>Break length</span>
                <span className="text-lg">{settings.breakLen} min</span>
              </div>
              <input
                type="range" min="1" max="30"
                value={settings.breakLen}
                onChange={(e) => set("breakLen", Number(e.target.value))}
                disabled={settings.breaks === 0}
                className="w-full mt-2"
                style={{ accentColor: BROWN }}
              />
            </label>
          </fieldset>

          <div className="mt-6">
            <div className={`${label} mb-2`}>Focus background</div>
            <div className="flex gap-3">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  aria-label={b.name}
                  title={b.name}
                  onClick={() => set("bg", b.id)}
                  className="w-8 h-8 rounded-full border-2 border-black/20"
                  style={{
                    background: b.bg,
                    outline: settings.bg === b.id ? `2px solid ${BROWN}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <p className="text-base text-black/60 mt-6">
            {totalFocus} min focus and {totalBreak} min break in total.
            {inProgress && " End the session to change length or breaks."}
          </p>
        </Popup>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border-2 border-[#4A2F20] bg-[#F6C945] text-[#4A2F20] text-lg px-6 py-2 shadow-[4px_4px_0_#4A2F20]"
        >
          {toast}
        </div>
      )}
    </div>
  );
}