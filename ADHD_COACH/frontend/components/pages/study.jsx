import { BACKGROUNDS, fmt, useStudy } from "./Usestudy";

// translucent versions of theme colors, e.g. mix("bg", 15) = --bg at 15% opacity
const mix = (name, pct) => `color-mix(in srgb, var(--${name}) ${pct}%, transparent)`;

export function Study() {
  const {
    settings,
    set,
    showSettings,
    setShowSettings,
    bgOpt,
    totalFocus,
    totalBreak,
    playlist,
    linkInput,
    setLinkInput,
    linkError,
    addPlaylist,
    removePlaylist,
    phases,
    phaseIndex,
    isFocus,
    remaining,
    running,
    finished,
    inProgress,
    progress,
    toggleRun,
    reset,
    toast,
  } = useStudy();

  const dark = bgOpt.dark;
  const ink = dark ? "var(--bg)" : "var(--text)";
  const accent = dark ? "var(--bg)" : "var(--button)";

  // timer ring
  const R = 88;
  const C = 2 * Math.PI * R;
  const ringColor = isFocus ? accent : "var(--accent)";

  const panel = `rounded-2xl border p-5 ${
    dark
      ? "bg-[color-mix(in_srgb,var(--bg)_10%,transparent)] border-[color-mix(in_srgb,var(--bg)_20%,transparent)]"
      : "bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] border-[var(--accent)]"
  }`;
  const primaryBtn = `rounded-xl px-8 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
    dark ? "bg-[var(--bg)] text-[var(--text)]" : "bg-[var(--button)] text-[var(--ink)]"
  }`;
  const ghostBtn = `rounded-xl px-6 py-3 text-sm font-medium border transition-colors disabled:opacity-40 ${
    dark
      ? "border-[color-mix(in_srgb,var(--bg)_30%,transparent)] hover:bg-[color-mix(in_srgb,var(--bg)_10%,transparent)]"
      : "border-[color-mix(in_srgb,var(--text)_20%,transparent)] hover:bg-[color-mix(in_srgb,var(--panel)_60%,transparent)]"
  }`;

  return (
    <div
      className="relative min-h-screen w-full transition-colors duration-500"
      style={{ background: bgOpt.bg, color: ink, fontFamily: "'Lexend', system-ui, sans-serif" }}
    >
      {/* settings toggle, top left */}
      <button
        type="button"
        onClick={() => setShowSettings((v) => !v)}
        aria-pressed={showSettings}
        aria-label="Focus settings"
        className={`absolute top-4 left-4 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow transition-colors ${
          showSettings
            ? dark
              ? "bg-[var(--bg)] text-[var(--text)]"
              : "bg-[var(--button)] text-[var(--ink)]"
            : dark
            ? "bg-[color-mix(in_srgb,var(--bg)_15%,transparent)] text-[var(--bg)]"
            : "bg-[var(--panel)] text-[var(--button)]"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="10" cy="12" r="2" />
          <circle cx="18" cy="18" r="2" />
        </svg>
      </button>

      {/* settings popover, only rendered while the toggle is on */}
      {showSettings && (
        <div className="absolute top-16 left-4 z-20 w-72 rounded-2xl bg-[var(--panel)] text-[var(--text)] border border-[var(--accent)] shadow-xl p-5 flex flex-col gap-5">
          <fieldset disabled={inProgress} className="flex flex-col gap-5 disabled:opacity-50">
            <label className="block">
              <div className="flex justify-between text-sm font-medium">
                <span>Focus length</span>
                <span className="text-[var(--button)]">{settings.focus} min</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                step="5"
                value={settings.focus}
                onChange={(e) => set("focus", Number(e.target.value))}
                className="w-full mt-2 accent-[var(--button)]"
              />
            </label>

            <div>
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Breaks</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label="Fewer breaks"
                    onClick={() => set("breaks", Math.max(0, settings.breaks - 1))}
                    className="w-8 h-8 rounded-full border border-[var(--accent)] hover:bg-[var(--bg)]"
                  >
                    -
                  </button>
                  <span className="w-4 text-center text-[var(--button)]">{settings.breaks}</span>
                  <button
                    type="button"
                    aria-label="More breaks"
                    onClick={() => set("breaks", Math.min(6, settings.breaks + 1))}
                    className="w-8 h-8 rounded-full border border-[var(--accent)] hover:bg-[var(--bg)]"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <label className="block">
              <div className="flex justify-between text-sm font-medium">
                <span>Break length</span>
                <span className="text-[var(--button)]">{settings.breakLen} min</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={settings.breakLen}
                onChange={(e) => set("breakLen", Number(e.target.value))}
                disabled={settings.breaks === 0}
                className="w-full mt-2 accent-[var(--accent)]"
              />
            </label>
          </fieldset>

          <div className="flex items-center justify-between text-sm font-medium">
            <span>Spotify player</span>
            <button
              type="button"
              role="switch"
              aria-checked={settings.music}
              aria-label="Show Spotify player"
              onClick={() => set("music", !settings.music)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.music ? "bg-[var(--button)]" : "bg-[var(--accent)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-[var(--panel)] shadow transition-transform ${
                  settings.music ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">Focus background</div>
            <div className="flex gap-2">
              {BACKGROUNDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-label={b.name}
                  title={b.name}
                  onClick={() => set("bg", b.id)}
                  className="w-8 h-8 rounded-full border border-[var(--accent)]"
                  style={{
                    background: b.bg,
                    outline: settings.bg === b.id ? "2px solid var(--button)" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>

          <p className="text-xs text-[var(--text)] opacity-70">
            {totalFocus} min focus and {totalBreak} min break in total.
            {inProgress && " Reset the timer to change length or breaks."}
          </p>
        </div>
      )}

      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* left: Spotify */}
        {settings.music && (
          <aside className="lg:w-[26rem] shrink-0 p-6 pt-20">
            <div className={panel}>
              <h2 className="text-sm font-semibold">Music</h2>
              {!playlist ? (
                <form onSubmit={addPlaylist} className="mt-3 flex flex-col gap-3">
                  <p className="text-sm opacity-70">Paste a Spotify playlist link to play it while you focus.</p>
                  <input
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    aria-label="Spotify playlist link"
                    className="w-full rounded-lg bg-[var(--panel)] text-[var(--text)] text-sm px-3 py-2.5 outline-none border border-[var(--accent)] focus:border-[var(--button)]"
                  />
                  {linkError && (
                    <p className="text-xs font-medium text-[var(--error)] bg-[var(--panel)] rounded-md px-2 py-1">
                      {linkError}
                    </p>
                  )}
                  <button type="submit" className={`${primaryBtn} self-start !px-5 !py-2.5`}>
                    Add playlist
                  </button>
                </form>
              ) : (
                <div className="mt-3">
                  <iframe
                    title="Spotify player"
                    src={`https://open.spotify.com/embed/${playlist.type}/${playlist.id}?utm_source=generator`}
                    width="100%"
                    height="352"
                    style={{ border: 0, borderRadius: 12 }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                  <button type="button" onClick={removePlaylist} className="mt-3 text-sm underline opacity-70 hover:opacity-100">
                    Change playlist
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* center: timer */}
        <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 pb-16">
          <div className="text-sm font-semibold opacity-80">
            {finished ? "Session complete" : isFocus ? "Focus" : "Break"}
          </div>

          <div className="relative w-72 h-72">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              <circle cx="100" cy="100" r={R} fill="none" stroke={ink} strokeOpacity="0.15" strokeWidth="10" />
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                style={{ transition: "stroke-dashoffset 0.3s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold tabular-nums">
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
                  background: p.type === "focus" ? accent : "var(--accent)",
                  opacity: i < phaseIndex || finished ? 1 : i === phaseIndex ? 0.75 : 0.25,
                }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={toggleRun} className={primaryBtn}>
              {finished ? "Start again" : running ? "Pause" : inProgress ? "Resume" : "Start"}
            </button>
            <button type="button" onClick={() => reset(true)} disabled={!inProgress} className={ghostBtn}>
              End session
            </button>
          </div>
        </main>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-[var(--button)] text-[var(--ink)] text-sm px-5 py-3 shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}