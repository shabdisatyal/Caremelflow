import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../supabaseclient";

// Tables used:
// focus_sessions: user_id, duration_minutes, created_at  (create with the SQL provided)
// card_progress:  user_id, card_id, interval, next_review, updated_at
// cards:          id, deck_id      decks: id, name
const FOCUS_TABLE = "focus_sessions";
// A card counts as mastered once its review interval reaches this many days.
const MASTERED_INTERVAL_DAYS = 21;
const MONTHLY_GOAL_MINUTES = 600;

const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const heat = ["#EFE8D6", "#CFE3D2", "#9CC3A5", "#5F9169", "#2F5D3A"];
const level = (m) => (m <= 0 ? 0 : m < 30 ? 1 : m < 60 ? 2 : m < 120 ? 3 : 4);

function Card({ title, right, children, className = "" }) {
  return (
    <section className={`rounded-2xl border border-[#E6DDC6] bg-white p-5 ${className}`}>
      {(title || right) && (
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#2B2118]">{title}</h2>
          {right && <span className="text-xs font-semibold text-[#3E6B4A]">{right}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

function Stat({ value, label, note, color }) {
  return (
    <div>
      <div className="text-5xl font-bold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-3 text-sm font-semibold text-[#5C4A38]">{label}</div>
      <div className="text-xs text-[#8A7B68] mt-1">{note}</div>
    </div>
  );
}

export function Progress() {
  const [sessions, setSessions] = useState([]);
  const [cards, setCards] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      const [s, p, c] = await Promise.all([
        supabase.from(FOCUS_TABLE).select("duration_minutes, created_at").eq("user_id", uid),
        supabase.from("card_progress").select("card_id, interval, next_review, updated_at").eq("user_id", uid),
        supabase.from("cards").select("id, deck_id, decks(name)").eq("user_id", uid),
      ]);
      if (!active) return;
      setSessions(s.data || []);
      setProgress(p.data || []);
      setCards(c.data || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const m = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const mo = now.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();

    const minutesByDay = {};
    const activeDays = new Set();
    let monthMinutes = 0;
    let monthSessions = 0;

    sessions.forEach((s) => {
      const d = new Date(s.created_at);
      const k = dayKey(d);
      minutesByDay[k] = (minutesByDay[k] || 0) + (s.duration_minutes || 0);
      activeDays.add(k);
      if (d.getFullYear() === y && d.getMonth() === mo) {
        monthMinutes += s.duration_minutes || 0;
        monthSessions += 1;
      }
    });
    progress.forEach((p) => p.updated_at && activeDays.add(dayKey(new Date(p.updated_at))));

    // streak counts back from today, or from yesterday if today has no activity yet
    let streak = 0;
    const cursor = new Date();
    if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (activeDays.has(dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const progressByCard = {};
    progress.forEach((p) => (progressByCard[p.card_id] = p));
    const cardById = {};
    const deckMap = {};
    let mastered = 0;
    cards.forEach((c) => {
      cardById[c.id] = c;
      const d = (deckMap[c.deck_id] = deckMap[c.deck_id] || {
        name: c.decks?.name || "Untitled deck",
        total: 0,
        mastered: 0,
      });
      d.total += 1;
      if ((progressByCard[c.id]?.interval || 0) >= MASTERED_INTERVAL_DAYS) {
        d.mastered += 1;
        mastered += 1;
      }
    });
    const decks = Object.values(deckMap).sort((a, b) => b.total - a.total);
    const now2 = Date.now();
    const due = progress.filter((p) => new Date(p.next_review).getTime() <= now2).length;

    const recent = [
      ...sessions.map((s) => ({
        at: s.created_at,
        title: `Completed ${s.duration_minutes} min focus session`,
        sub: "Focus session",
        color: "#2F5D3A",
      })),
      ...progress
        .filter((p) => p.updated_at)
        .map((p) => {
          const isMastered = p.interval >= MASTERED_INTERVAL_DAYS;
          return {
            at: p.updated_at,
            title: `Reviewed a card in ${cardById[p.card_id]?.decks?.name || "a deck"}`,
            sub: isMastered ? "Mastered" : "Learning",
            color: isMastered ? "#4C7A54" : "#7FA6C6",
          };
        }),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6);

    return {
      y,
      mo,
      today: now.getDate(),
      daysInMonth,
      minutesByDay,
      monthMinutes,
      monthSessions,
      streak,
      decks,
      due,
      mastered,
      masteryPct: cards.length ? Math.round((mastered / cards.length) * 100) : 0,
      goalPct: Math.min(100, Math.round((monthMinutes / MONTHLY_GOAL_MINUTES) * 100)),
      recent,
    };
  }, [sessions, cards, progress]);

  if (loading) return <p className="text-sm text-[#8A7B68] py-10">Loading your progress...</p>;

  const monthName = new Date(m.y, m.mo, 1).toLocaleDateString("en-US", { month: "long" });
  const R = 62;
  const C = 2 * Math.PI * R;
  const hours = (m.monthMinutes / 60).toFixed(1).replace(/\.0$/, "");

  return (
    <div className="flex flex-col gap-8" style={{ fontFamily: "'Lexend', system-ui, sans-serif" }}>
      {/* headline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 px-2">
        <Stat value={m.decks.length} label="Decks" note="With cards to study" color="#7A5230" />
        <Stat value={`${m.masteryPct}%`} label="Cards mastered" note={`${m.mastered} of ${cards.length} cards`} color="#3E6B4A" />
        <Stat value={`${hours}h`} label="Focus time" note={`This month, ${m.monthSessions} sessions`} color="#2F5D3A" />
        <Stat value={m.streak} label="Day streak" note="Days in a row with activity" color="#7A5230" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* flashcard decks */}
        <Card title="Flashcard decks" right={`${m.due} due now`}>
          {m.decks.length === 0 ? (
            <p className="text-sm text-[#8A7B68]">No decks yet. Review some flashcards and they will show up here.</p>
          ) : (
            <ul className="flex flex-col gap-5">
              {m.decks.map((d) => {
                const pct = Math.round((d.mastered / d.total) * 100);
                return (
                  <li key={d.name}>
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-[#2B2118]">{d.name}</span>
                      <span className="text-sm font-bold text-[#3E6B4A]">{pct}%</span>
                    </div>
                    <div className="text-xs text-[#8A7B68] mt-0.5">
                      {d.mastered}/{d.total} mastered
                    </div>
                    <div className="h-1.5 rounded-full bg-[#B0CDE6]/40 mt-2 overflow-hidden">
                      <div className="h-full rounded-full bg-[#4C7A54]" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* heatmap + recent */}
        <div className="flex flex-col gap-6">
          <Card title={`Focus sessions in ${monthName}`} right={`${hours}h total`}>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: m.daysInMonth }, (_, i) => {
                const day = i + 1;
                const mins = m.minutesByDay[dayKey(new Date(m.y, m.mo, day))] || 0;
                const future = day > m.today;
                const lv = level(mins);
                return (
                  <div
                    key={day}
                    title={`${mins} min`}
                    className="aspect-square rounded-md flex items-center justify-center text-[11px] font-semibold"
                    style={{
                      background: future ? "#F7F2E6" : heat[lv],
                      color: future ? "#CDBFA3" : lv >= 3 ? "#fff" : "#7A6A55",
                      outline: day === m.today ? "2px solid #7A5230" : "none",
                      outlineOffset: 1,
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-[#8A7B68]">
              Less
              {heat.map((c) => (
                <span key={c} className="w-3.5 h-3.5 rounded-sm" style={{ background: c }} />
              ))}
              More
            </div>
          </Card>

          <Card title="Recent activity">
            {m.recent.length === 0 ? (
              <p className="text-sm text-[#8A7B68]">Nothing yet. Start a focus session to get going.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {m.recent.map((r, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
                    <div>
                      <div className="text-sm font-medium text-[#2B2118]">{r.title}</div>
                      <div className="text-xs text-[#8A7B68]">
                        {r.sub}, {timeAgo(r.at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* goal + streak */}
        <div className="flex flex-col gap-6">
          <Card title="Monthly goal" right={`${MONTHLY_GOAL_MINUTES / 60}h target`}>
            <div className="flex justify-center py-2">
              <svg viewBox="0 0 160 160" className="w-44 h-44 -rotate-90">
                <circle cx="80" cy="80" r={R} fill="none" stroke="#B0CDE6" strokeOpacity="0.45" strokeWidth="12" />
                <circle
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke="#3E6B4A"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - m.goalPct / 100)}
                />
                <g className="rotate-90 origin-center">
                  <text x="80" y="86" textAnchor="middle" fontSize="30" fontWeight="700" fill="#2B2118">
                    {m.goalPct}%
                  </text>
                  <text x="80" y="104" textAnchor="middle" fontSize="11" fill="#8A7B68">
                    of goal
                  </text>
                </g>
              </svg>
            </div>
          </Card>

          <section className="rounded-2xl p-6 text-white bg-gradient-to-br from-[#4A2E1B] to-[#7A5230]">
            <div className="text-sm text-white/70">Current streak</div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-bold text-[#FCF1D0]">
                {m.streak}
              </span>
              <span className="text-lg text-white/80">{m.streak === 1 ? "day" : "days"}</span>
            </div>
            <div className="flex gap-1.5 mt-5">
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: i < Math.min(m.streak, 7) ? "#FCF1D0" : "rgba(255,255,255,0.18)" }}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}