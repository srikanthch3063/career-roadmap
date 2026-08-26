import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Helper to extract words from text
const extractKeywords = (text: string) => {
  if (!text) return [];
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
  const stopWords = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'want', 'like', 'make', 'get', 'would', 'also', 'really']);
  return words.filter(w => w.length > 2 && !stopWords.has(w));
};

router.get('/stats', requireAuth, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    // 1. Get total students (Funnel Step 1)
    const { count: studentCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // 2. Get students details
    const { data: students } = await supabase
      .from('profiles')
      .select('id, name, email, branch, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    // 3. Get roadmaps (Funnel Step 3 & API Usage)
    const { data: roadmaps } = await supabase
      .from('roadmaps')
      .select('user_id, primary_career');

    // 4. Get quiz responses (Funnel Step 2 & Word Cloud)
    const { data: quizResponses } = await supabase
      .from('quiz_responses')
      .select('user_id, free_text');

    // Funnel Unique Counts
    const uniqueQuizUsers = new Set(quizResponses?.map(q => q.user_id)).size;
    const uniqueRoadmapUsers = new Set(roadmaps?.map(r => r.user_id)).size;

    // Time-series (Daily Signups)
    const signupsByDate: Record<string, number> = {};
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    
    // Initialize with 0
    last30Days.forEach(date => signupsByDate[date] = 0);
    
    students?.forEach(s => {
      const date = new Date(s.created_at).toISOString().split('T')[0];
      if (signupsByDate[date] !== undefined) {
        signupsByDate[date]++;
      }
    });

    const daily_signups = last30Days.map(date => ({
      date: date.slice(5), // MM-DD
      count: signupsByDate[date]
    }));

    // Keyword Extraction for Word Cloud
    const wordCounts: Record<string, number> = {};
    quizResponses?.forEach(q => {
      if (q.free_text) {
        const words = extractKeywords(q.free_text);
        words.forEach(w => {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        });
      }
    });

    const word_cloud = Object.entries(wordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30); // Top 30 words

    const careersCount: Record<string, number> = {};
    const branchesCount: Record<string, number> = {};

    const enrichedStudents = students?.map(student => {
      const studentRoadmap = roadmaps?.find(r => r.user_id === student.id);
      
      if (studentRoadmap?.primary_career) {
        careersCount[studentRoadmap.primary_career] = (careersCount[studentRoadmap.primary_career] || 0) + 1;
      }
      
      if (student.branch) {
        branchesCount[student.branch] = (branchesCount[student.branch] || 0) + 1;
      }

      return {
        ...student,
        primary_career: studentRoadmap?.primary_career || 'Not generated'
      };
    }) || [];

    let mostCommonBranch = 'N/A';
    let maxBranchCount = 0;
    for (const [branch, count] of Object.entries(branchesCount)) {
      if (count > maxBranchCount) {
        maxBranchCount = count;
        mostCommonBranch = branch;
      }
    }

    let mostCommonCareer = 'N/A';
    let maxCareerCount = 0;
    for (const [career, count] of Object.entries(careersCount)) {
      if (count > maxCareerCount) {
        maxCareerCount = count;
        mostCommonCareer = career;
      }
    }

    // Phase 8: events funnel (roadmap_view + mentor)
    let eventsStats: any = { mentor_messages: 0, roadmap_views: 0, unique_mentor_users: 0, avg_mentor_per_user: 0 };
    try {
      const { data: events } = await supabase.from('events').select('user_id, event_type');
      if (events) {
        const mentorEvents = events.filter(e=> e.event_type==='mentor_message');
        const roadmapViews = events.filter(e=> e.event_type==='roadmap_view');
        const uniqMentor = new Set(mentorEvents.map(e=> e.user_id)).size;
        eventsStats = {
          mentor_messages: mentorEvents.length,
          roadmap_views: roadmapViews.length,
          unique_mentor_users: uniqMentor,
          avg_mentor_per_user: uniqMentor ? Number((mentorEvents.length/uniqMentor).toFixed(1)) : 0,
        };
      }
    } catch (e) { console.warn('events stats failed', e); }

    res.json({
      stats: {
        total_students: studentCount || 0,
        total_roadmaps: roadmaps?.length || 0,
        funnel: {
          signed_up: studentCount || 0,
          took_quiz: uniqueQuizUsers,
          generated_roadmap: uniqueRoadmapUsers,
          ...eventsStats,
        },
        daily_signups,
        word_cloud,
        most_common_branch: mostCommonBranch,
        most_common_career: mostCommonCareer,
        events: eventsStats,
      },
      students: enrichedStudents
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/student/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    const studentId = req.params.id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { data: quizResponses } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    const { data: roadmaps } = await supabase
      .from('roadmaps')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    res.json({
      profile,
      quizResponses: quizResponses || [],
      roadmaps: roadmaps || []
    });

  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/config', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from('system_config').select('config').eq('id', 1).single();
    if (error) throw error;
    res.json(data?.config || {});
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

router.post('/config', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { error } = await supabase.from('system_config').update({ config: req.body }).eq('id', 1);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error writing config:', error);
    res.status(500).json({ error: 'Failed to write config' });
  }
});

router.get('/tickets', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

router.patch('/tickets/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', id);
      
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Block / Unblock student (Phase 6) - toggles is_blocked
router.post('/block/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const studentId = req.params.id;
    const { blocked } = req.body; // true = block, false = unblock
    const { error } = await supabase.from('profiles').update({ is_blocked: !!blocked, blocked_at: blocked ? new Date().toISOString() : null }).eq('id', studentId);
    if (error) throw error;
    res.json({ success: true, is_blocked: !!blocked });
  } catch (error) {
    console.error('Error toggling block:', error);
    res.status(500).json({ error: 'Failed to toggle block' });
  }
});

// Secure student deletion via service_role (replaces client-side delete)
router.delete('/student/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const studentId = req.params.id;
    // Delete roadmaps + quiz first (FK cascade but explicit)
    await supabase.from('roadmaps').delete().eq('user_id', studentId);
    await supabase.from('quiz_responses').delete().eq('user_id', studentId);
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', studentId);
    if (profileError) throw profileError;
    // Also delete auth user via admin API
    try {
      await supabase.auth.admin.deleteUser(studentId);
    } catch (e) {
      console.warn('Auth admin delete failed (non-critical):', e);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
});

export default router;
