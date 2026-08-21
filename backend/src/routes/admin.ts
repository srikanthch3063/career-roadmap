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

router.get('/stats', requireAuth, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    // 1. Get total students
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

    // 3. Get roadmaps to attach primary_career and find most common
    const { data: roadmaps } = await supabase
      .from('roadmaps')
      .select('user_id, primary_career');

    const careersCount: Record<string, number> = {};
    const branchesCount: Record<string, number> = {};

    const enrichedStudents = students?.map(student => {
      const studentRoadmap = roadmaps?.find(r => r.user_id === student.id);
      
      // Tally career
      if (studentRoadmap?.primary_career) {
        careersCount[studentRoadmap.primary_career] = (careersCount[studentRoadmap.primary_career] || 0) + 1;
      }
      
      // Tally branch
      if (student.branch) {
        branchesCount[student.branch] = (branchesCount[student.branch] || 0) + 1;
      }

      return {
        ...student,
        primary_career: studentRoadmap?.primary_career || 'Not generated'
      };
    }) || [];

    // Calculate most common
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

    res.json({
      stats: {
        total_students: studentCount || 0,
        most_common_branch: mostCommonBranch,
        most_common_career: mostCommonCareer,
      },
      students: enrichedStudents
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/config', requireAuth, requireAdmin, (req: any, res: any) => {
  try {
    const configPath = path.join(__dirname, '../data/config.json');
    const rawData = fs.readFileSync(configPath, 'utf8');
    res.json(JSON.parse(rawData));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read config' });
  }
});

router.post('/config', requireAuth, requireAdmin, (req: any, res: any) => {
  try {
    const configPath = path.join(__dirname, '../data/config.json');
    fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to write config' });
  }
});

router.get('/student/:id', requireAuth, requireAdmin, async (req: AuthRequest, res: any) => {
  try {
    const studentId = req.params.id;

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Fetch quiz responses (most recent first)
    const { data: quizResponses } = await supabase
      .from('quiz_responses')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    // Fetch generated roadmaps
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

export default router;
