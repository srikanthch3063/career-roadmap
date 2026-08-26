import { supabase } from '../supabase';

export async function track(event_type: 'page_view'|'roadmap_view'|'mentor_message'|'weekly_view'|'time_spent'|'task_completed', metadata: any = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    await fetch(`${apiUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ event_type, metadata })
    });
  } catch (e) { console.warn('track failed', e); }
}
