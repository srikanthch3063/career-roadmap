import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

// POST /api/events  { event_type, metadata? }
router.post('/events', requireAuth, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user!.id;
    const { event_type, metadata } = req.body;
    if (!event_type || !['page_view','roadmap_view','mentor_message','weekly_view'].includes(event_type)) {
      return res.status(400).json({ error: 'invalid event_type' });
    }
    const { error } = await supabase.from('events').insert({ user_id: userId, event_type, metadata: metadata || {} });
    if (error) throw error;
    res.json({ success: true });
  } catch (e) {
    console.error('events insert failed', e);
    res.status(500).json({ error: 'failed' });
  }
});

export default router;
