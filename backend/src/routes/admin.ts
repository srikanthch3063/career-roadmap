import { Router } from 'express';
import { requireAuth, requireAdmin, AuthRequest } from '../middleware/auth';
import { createClient } from '@supabase/supabase-js';

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

export default router;
