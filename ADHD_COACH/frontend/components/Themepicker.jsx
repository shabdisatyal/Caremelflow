import { useState } from "react";
import { applyTheme, SEASONS, loadSavedTheme, THEMES } from "../Themes";

const HAIR = "color-mix(in srgb, var(--text) 12%, transparent)";

export function ThemePicker({ onChange }) {
  const [current, setCurrent] = useState(loadSavedTheme);
  const [season, setSeason] = useState(THEMES[loadSavedTheme()].season);

  const choose = (id) => {
    setCurrent(id);
    applyTheme(id);
    onChange?.(id);
  };

  const options = Object.entries(THEMES).filter(([, t]) => t.season === season);

  return (
    <div>
      {/* season tabs */}
      <div className="flex flex-wrap gap-4 mb-4">
        {SEASONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeason(s)}
            aria-pressed={season === s}
            className={`text-sm capitalize pb-1 border-b-2 transition-colors ${
              season === s
                ? "border-[var(--button)] text-[var(--button)]"
                : "border-transparent text-[var(--text)] opacity-60 hover:opacity-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* theme cards */}
      <div className="grid grid-cols-2 gap-3">
        {options.map(([id, theme]) => {
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => choose(id)}
              aria-pressed={active}
              className={`overflow-hidden rounded-lg border text-left transition-colors ${
                active ? "border-[var(--button)]" : ""
              }`}
              style={active ? undefined : { borderColor: HAIR }}
            >
              <div className="flex h-10">
                {["--bg", "--panel", "--accent", "--button"].map((v) => (
                  <span key={v} className="flex-1" style={{ background: theme.vars[v] }} />
                ))}
              </div>
              <div className="px-3 py-2 text-sm text-[var(--text)] truncate">{theme.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}