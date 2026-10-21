import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../supabaseclient";


export const BACKGROUNDS = [
  { id: "cream", name: "Cream", bg: "#F5EFE1", dark: false },
  { id: "sky", name: "Sky", bg: "#B0CDE6", dark: false },
  { id: "mist", name: "Mist", bg: "#AEC4D4", dark: false },
  { id: "butter", name: "Butter", bg: "#FCF1D0", dark: false },
  { id: "forest", name: "Forest", bg: "#2F5233", dark: true },
  { id: "cocoa", name: "Cocoa", bg: "#4A2E1B", dark: true },
];

const DEFAULTS = { focus: 25, breaks: 3, breakLen: 5, bg: "cream", music: true };

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// Accepts a Spotify share link or a spotify:playlist:ID URI
function parseSpotify(input) {
  const m = input.trim().match(/(playlist|album|track|show|episode)[/:]([A-Za-z0-9]+)/);
  return m ? { type: m[1], id: m[2] } : null;
}

// Focus blocks separated by breaks: N breaks means N + 1 focus blocks
function buildPhases(s) {
  const out = [];
  for (let i = 0; i <= s.breaks; i++) {
    out.push({ type: "focus", minutes: s.focus });
    if (i < s.breaks) out.push({ type: "break", minutes: s.breakLen });
  }
  return out;
}

export const fmt = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

async function logSession(minutes) {
  const { error } = await supabase.from("focus_sessions").insert({ duration_minutes: minutes });
  return !error;
}


export function useStudy() {
  const [settings, setSettings] = useState(() => ({ ...DEFAULTS, ...load("study:settings", {}) }));
  const [showSettings, setShowSettings] = useState(false);
  const [playlist, setPlaylist] = useState(() => load("study:playlist", null));
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState("");
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(settings.focus * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [toast, setToast] = useState("");
  const endRef = useRef(0);
  const firedRef = useRef(-1);

  const phases = useMemo(() => buildPhases(settings), [settings]);
  const current = phases[Math.min(phaseIndex, phases.length - 1)];
  const inProgress = started;
  const bgOpt = BACKGROUNDS.find((b) => b.id === settings.bg) || BACKGROUNDS[0];
  const isFocus = current.type === "focus";

  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  // keep the idle timer in sync with settings
  useEffect(() => {
    save("study:settings", settings);
    if (!inProgress) setRemaining(phases[0].minutes * 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // countdown based on a fixed end time, so it stays accurate in background tabs
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left > 0 || firedRef.current === phaseIndex) return;
      firedRef.current = phaseIndex;
      const done = phases[phaseIndex];
      if (done.type === "focus") {
        logSession(done.minutes).then((ok) =>
          setToast(ok ? `Saved a ${done.minutes} min focus session` : "Could not save this session")
        );
      }
      if (phaseIndex + 1 >= phases.length) {
        setRunning(false);
        setFinished(true);
      } else {
        const next = phases[phaseIndex + 1];
        endRef.current = Date.now() + next.minutes * 60000;
        setPhaseIndex(phaseIndex + 1);
        setRemaining(next.minutes * 60);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running, phaseIndex, phases]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const prev = document.title;
    document.title = running ? `${fmt(remaining)} ${isFocus ? "Focus" : "Break"}` : "Study";
    return () => {
      document.title = prev;
    };
  }, [running, remaining, isFocus]);

  const reset = (log = true) => {
    if (log && !finished && current.type === "focus") {
      const mins = Math.floor((current.minutes * 60 - remaining) / 60);
      if (mins >= 1) {
        logSession(mins).then((ok) =>
          setToast(ok ? `Saved a ${mins} min focus session` : "Could not save this session")
        );
      }
    }
    firedRef.current = -1;
    setStarted(false);
    setRunning(false);
    setFinished(false);
    setPhaseIndex(0);
    setRemaining(phases[0].minutes * 60);
  };

  const toggleRun = () => {
    if (finished) return reset(false);
    if (running) return setRunning(false);
    endRef.current = Date.now() + remaining * 1000;
    setStarted(true);
    setRunning(true);
  };

  const addPlaylist = (e) => {
    e.preventDefault();
    const p = parseSpotify(linkInput);
    if (!p) {
      setLinkError("That is not a Spotify link. Use Share, then Copy link, in Spotify.");
      return;
    }
    setPlaylist(p);
    save("study:playlist", p);
    setLinkInput("");
    setLinkError("");
  };

  const removePlaylist = () => {
    setPlaylist(null);
    try {
      localStorage.removeItem("study:playlist");
    } catch {}
  };

  const total = current.minutes * 60;
  const progress = finished ? 1 : 1 - remaining / total;
  const totalFocus = settings.focus * (settings.breaks + 1);
  const totalBreak = settings.breakLen * settings.breaks;

  return {
    // settings
    settings,
    set,
    showSettings,
    setShowSettings,
    bgOpt,
    totalFocus,
    totalBreak,
    // music
    playlist,
    linkInput,
    setLinkInput,
    linkError,
    addPlaylist,
    removePlaylist,
    // timer
    phases,
    phaseIndex,
    current,
    isFocus,
    remaining,
    running,
    finished,
    inProgress,
    progress,
    toggleRun,
    reset,
    // feedback
    toast,
  };
}