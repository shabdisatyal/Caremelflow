
import { SHOWED_UP_WINDOW_MS } from '../components/constants';
import { fetchRange} from '../components/supabase';
import { supabase } from '../../../../supabaseclient';
import { ymd, parseDate } from '../utils/dates';


export async function buildReport(days) {
  const perDay = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return {
      key: ymd(d),
      short: d.toLocaleDateString(undefined, { weekday: 'short' }),
      long: d.toLocaleDateString(undefined, { weekday: 'long' }),
      minutes: 0,
    };
  });
  const since = parseDate(perDay[0].key).getTime();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) throw new Error('You are signed out.');

  const sessionRows = await fetchRange('focus_sessions', 'duration_minutes, created_at', since, uid);
  // If the check in table is missing, still build the report from sessions alone.
  const logRows = await fetchRange('cant_start_logs', 'reasons, energy, created_at', since, uid).catch(
    (err) => {
      console.error('Could not load check ins:', err);
      return [];
    }
  );
  const sessions = sessionRows.map((s) => ({ at: s.created_at, minutes: s.duration_minutes }));
  const logs = logRows.map((l) => ({ at: l.created_at, reasons: l.reasons || [], energy: l.energy }));

  sessions.forEach((s) => {
    const slot = perDay.find((p) => p.key === ymd(new Date(s.at)));
    if (slot) slot.minutes += s.minutes;
  });

  const total = sessions.reduce((sum, s) => sum + s.minutes, 0);

  // A session counts as "showed up anyway" if it followed a can't start check in within 6 hours.
  const showedUp = sessions.filter((s) => {
    const t = new Date(s.at).getTime();
    return logs.some((l) => {
      const lt = new Date(l.at).getTime();
      return lt <= t && t <= lt + SHOWED_UP_WINDOW_MS;
    });
  });

  const insights = [];
  if (showedUp.length) {
    const longest = Math.max(...showedUp.map((s) => s.minutes));
    insights.push(
      `You showed up for a ${longest} min focus session even when you did not feel like it.`
    );
    if (showedUp.length > 1) {
      insights.push(`That happened ${showedUp.length} times in this period. Starting while stuck is the hard part, and you did it.`);
    }
  }
  if (sessions.length) {
    insights.push(`You focused for ${total} minutes across ${sessions.length} sessions.`);
    const best = perDay.reduce((a, b) => (b.minutes > a.minutes ? b : a));
    if (best.minutes > 0) insights.push(`${best.long} was your strongest day, with ${best.minutes} minutes.`);
  }
  if (logs.length) {
    const counts = {};
    logs.forEach((l) => l.reasons.forEach((r) => (counts[r] = (counts[r] || 0) + 1)));
    const [topReason] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    insights.push(`What got in your way most often: ${topReason.toLowerCase()}.`);
    const avg = (logs.reduce((s, l) => s + l.energy, 0) / logs.length).toFixed(1);
    insights.push(`Your average energy when you felt stuck was ${avg} out of 5.`);
  }
  return { days, perDay, total, count: sessions.length, insights };
}
