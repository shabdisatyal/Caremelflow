
import { supabase } from '../../../../supabaseclient';


export async function fetchRange(table, columns, sinceMs, uid) {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .eq('user_id', uid)
    .gte('created_at', new Date(sinceMs).toISOString())
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function saveCheckIn({ mood, reasons, energy, note }) {
  const { error } = await supabase
    .from('cant_start_logs')
    .insert({ mood, reasons, energy, note: note || null });
  if (error) console.error('Failed to save check in:', error);
}
