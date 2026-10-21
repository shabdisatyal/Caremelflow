
import { useState } from "react";
import {
  applyTheme,
  SEASONS,
  loadSavedTheme,
  THEMES,
} from "../Themes";

export function ThemePicker({ onChange }) {
  const [current, setCurrent] = useState(loadSavedTheme);
  const [season, setSeason] = useState(
    THEMES[loadSavedTheme()].season
  );
  const [isOpen, setIsOpen] = useState(false);

  const choose = (id) => {
    setCurrent(id);
    applyTheme(id);
    onChange?.(id);
    setIsOpen(false);
  };

  const options = Object.entries(THEMES).filter(
    ([, theme]) => theme.season === season
  );

  return (
    <div>
      {/* Compact theme section */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">
            Theme
          </h2>
          <p className="mt-1 text-sm text-[var(--text)] opacity-70">
            Current theme: {THEMES[current].label}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-semibold text-[var(--ink)] bg-[var(--button)] hover:opacity-90 transition-opacity"
        >
          Choose Theme
        </button>
      </div>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="theme-modal-title"
            className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-none] bg-[var(--panel)] p-5 sm:p-8 shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="theme-modal-title"
                  className="text-2xl font-bold text-[var(--text)]"
                >
                  Choose your theme
                </h2>
                <p className="mt-1 text-sm text-[var(--text)] opacity-70">
                  Find a color palette that feels like you.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close theme picker"
                className="rounded-lg px-3 py-1 text-xl text-[var(--text)] hover:bg-[var(--bg)]"
              >
                &times;
              </button>
            </div>

            {/* Season tabs */}
            <div className="mt-6 flex flex-wrap gap-2">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeason(s)}
                  aria-pressed={season === s}
                  className={
                    "rounded-full border px-4 py-2 text-sm capitalize transition-colors " +
                    (season === s
                      ? "border-none bg-[var(--button)] text-[var(--ink)]"
                      : "border-none text-[var(--text)] hover:border-[var(--button)]")
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Theme cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {options.map(([id, theme]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => choose(id)}
                  aria-pressed={current === id}
                  className={
                    "overflow-hidden rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 " +
                    (current === id
                      ? "border-[var(--button)]"
                      : "border-[var(--accent)] hover:border-[var(--button)]")
                  }
                >
                  <div className="flex h-20">
                    {["--bg", "--panel", "--accent", "--button"].map(
                      (variable) => (
                        <span
                          key={variable}
                          className="flex-1"
                          style={{
                            background: theme.vars[variable],
                          }}
                        />
                      )
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-[var(--bg)] px-3 py-3">
                    <span className="text-sm font-medium text-[var(--text)]">
                      {theme.label}
                    </span>

                    {current === id && (
                      <span className="text-sm font-semibold text-[var(--text)]">
                        ✓ Selected
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-none px-5 py-2.5 text-sm font-medium text-[var(--text)] hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
