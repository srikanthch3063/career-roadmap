import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Stricter rate limit for generation endpoint (e.g., 5 requests per 15 minutes)
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many roadmap generations, please try again later.' }
});

const getFallbackRoadmap = (branch: string) => {
  try {
    const rawData = fs.readFileSync(path.join(__dirname, '../data/fallbackRoadmaps.json'), 'utf8');
    const roadmaps = JSON.parse(rawData);
    
    // Simple matching logic
    const matched = roadmaps.find((r: any) => r.branch.toLowerCase().includes(branch.toLowerCase().split(' ')[0]));
    if (matched) return matched.roadmap;
    return roadmaps[0].roadmap; // Return first one if no match
  } catch (err) {
    console.error('Error reading fallback roadmaps:', err);
    throw new Error('Could not generate roadmap and fallback failed.');
  }
};

const validateSchema = (data: any) => {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.recommended_careers)) return false;
  if (typeof data.primary_career !== 'string') return false;
  if (typeof data.reasoning !== 'string') return false;
  if (!data.roadmap || typeof data.roadmap !== 'object') return false;
  
  const rm = data.roadmap;
  if (!Array.isArray(rm.skills_to_learn)) return false;
  if (!Array.isArray(rm.technologies)) return false;
  if (!Array.isArray(rm.project_ideas)) return false;
  if (!Array.isArray(rm.certifications)) return false;
  if (typeof rm.internship_advice !== 'string') return false;
  if (!Array.isArray(rm.job_titles)) return false;
  
  return true;
};

router.post('/generate-roadmap', requireAuth, generateLimiter, async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user!.id;

    // 1. Pull student's branch + quiz answers from Supabase
    const { data: profile } = await supabase.from('profiles').select('branch').eq('id', userId).single();
    const { data: quizResponses } = await supabase
      .from('quiz_responses')
      .select('answers, free_text')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!profile || !profile.branch) {
      return res.status(400).json({ error: 'Branch not set in profile' });
    }
    if (!quizResponses) {
      return res.status(400).json({ error: 'Quiz responses not found' });
    }

    const branch = profile.branch;
    const answers = quizResponses.answers || {};
    const freeText = quizResponses.free_text || 'None';

    let finalRoadmapJSON = null;

    if (groq) {
      // 2. Build System Prompt
      const systemPrompt = `You are a brutally honest, highly opinionated, and incredibly specific Lead Career Counselor for top-tier engineering students.
Your goal is to generate a deeply personalized, non-generic career roadmap based on the student's constraints. 

DO NOT give generic advice like "Learn Python" or "Do internships". Give highly specific advice like "Master FastAPI and Pydantic", "Build a distributed cache system in Rust", or "Target Series B climate-tech startups".
If they mention specific constraints (e.g. they hate frontend, they want to work in finance), YOU MUST aggressively tailor the roadmap to those constraints.

You must return the response as a strict JSON object with this exact schema:
{
  "recommended_careers": ["string (e.g. 'HFT C++ Engineer', 'Kernel Developer')"],
  "primary_career": "string",
  "reasoning": "string (Explain EXACTLY why you chose this based on their constraints. Be opinionated.)",
  "roadmap": {
    "skills_to_learn": ["string (Highly specific skills)"],
    "technologies": ["string (Specific frameworks, libraries, tools)"],
    "project_ideas": ["string (Non-trivial, resume-worthy project ideas. No to-do lists.)"],
    "certifications": ["string (Or specify 'None needed for this field' if applicable)"],
    "internship_advice": "string (Actionable advice tailored to their niche)",
    "job_titles": ["string (Specific titles to search for)"]
  }
}

Student Data:
Branch: ${branch}
Quiz Answers: ${JSON.stringify(answers)}
Additional Constraints/Info: ${freeText}`;

      try {
        // 3. Call Groq with timeout
        const groqPromise = groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt }
          ],
          model: 'openai/gpt-oss-120b',
          temperature: 0.85,
          response_format: { type: 'json_object' }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Groq API timed out after 30 seconds. The AI model is taking too long. Please try again.')), 30000)
        );

        const chatCompletion = await Promise.race([groqPromise, timeoutPromise]) as any;
        const jsonResponse = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
        
        // 5. Validate Parsed JSON
        if (validateSchema(jsonResponse)) {
          finalRoadmapJSON = jsonResponse;
          console.log('✅ Groq AI generated a unique roadmap for:', branch);
        } else {
          console.error('⚠️ Groq returned valid JSON but schema was invalid. Keys received:', Object.keys(jsonResponse));
        }
      } catch (err: any) {
        if (err.status === 404) {
          console.error('❌ Groq model not found. Check the model name in roadmap.ts. Error:', err.message);
        } else if (err.status === 401) {
          console.error('❌ Groq API key is invalid. Check GROQ_API_KEY in .env. Error:', err.message);
        } else if (err.status === 429) {
          console.error('❌ Groq rate limit exceeded. Wait a minute and try again. Error:', err.message);
        } else {
          console.error('❌ Groq generation failed:', err.message);
        }
        // Fallback silently to static data
      }
    }

    // 6. Fallback
    if (!finalRoadmapJSON) {
      finalRoadmapJSON = getFallbackRoadmap(branch);
    }

    // 7. Save to database
    const { error: insertError } = await supabase
      .from('roadmaps')
      .insert({
        user_id: userId,
        roadmap: finalRoadmapJSON,
        primary_career: finalRoadmapJSON.primary_career
      });

    if (insertError) {
      console.error("Failed to save roadmap to DB:", insertError);
      return res.status(500).json({ error: 'Failed to save roadmap' });
    }

    res.json(finalRoadmapJSON);

  } catch (error: any) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Follow-up Chat Endpoint
router.post('/chat', requireAuth, async (req: any, res: any) => {
  try {
    const { question, roadmapContext } = req.body;
    
    if (!question || !roadmapContext) {
      return res.status(400).json({ error: 'Question and roadmap context are required' });
    }

    const systemPrompt = `You are a helpful, expert career counselor and technical mentor. 
You previously generated the following career roadmap for the user:
${JSON.stringify(roadmapContext)}

The user has a follow-up question. Provide a concise, highly actionable, and encouraging answer. 
Format your response in plain text or markdown. Do NOT return JSON.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
    });

    res.json({ answer: chatCompletion.choices[0]?.message?.content || 'Sorry, I could not generate an answer.' });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
});

// Weekly Plan Generator Endpoint
router.post('/plan', requireAuth, async (req: any, res: any) => {
  try {
    const { roadmapContext } = req.body;
    
    if (!roadmapContext) {
      return res.status(400).json({ error: 'Roadmap context is required' });
    }

    const systemPrompt = `You are an expert technical curriculum designer.
Given the following career roadmap:
${JSON.stringify(roadmapContext)}

Generate a structured 12-week learning plan that breaks down the 'skills_to_learn' and 'technologies' into bite-sized weekly goals.
Return ONLY a valid JSON object matching this schema exactly:
{
  "weeks": [
    {
      "week_number": 1,
      "focus": "String describing the weekly theme",
      "tasks": ["Task 1", "Task 2", "Task 3"]
    }
  ]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const jsonResponse = JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    res.json(jsonResponse);
  } catch (error: any) {
    console.error('Error generating plan:', error);
    res.status(500).json({ error: 'Failed to generate weekly plan' });
  }
});

// Update Progress Endpoint
router.put('/progress', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { checkedItems } = req.body; // array of strings (item names)
    
    if (!Array.isArray(checkedItems)) {
      return res.status(400).json({ error: 'checkedItems must be an array' });
    }

    // Since users might have multiple roadmaps, we'll update the most recent one for now
    // Or we could pass roadmap_id if we had it on the frontend.
    const { data: latestRoadmaps } = await supabase
      .from('roadmaps')
      .select('id, roadmap')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (latestRoadmaps && latestRoadmaps.length > 0) {
      const latest = latestRoadmaps[0];
      const updatedRoadmap = { ...latest.roadmap, checked_items: checkedItems };
      
      await supabase
        .from('roadmaps')
        .update({ roadmap: updatedRoadmap })
        .eq('id', latest.id);
        
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'No roadmap found' });
    }
  } catch (error: any) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

export default router;
