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
      // 2. Read System Prompt from Config
      let config: any = {};
      try {
        const { data } = await supabase.from('system_config').select('config').eq('id', 1).single();
        if (data) config = data.config || {};
      } catch (err) {
        console.error('Error reading config from supabase, using defaults.', err);
      }

      const defaultRoadmapPrompt = `You are a brutally honest, highly opinionated, and incredibly specific Lead Career Counselor for top-tier engineering students.\nYour goal is to generate a deeply personalized, non-generic career roadmap based on the student's constraints. \n\nDO NOT give generic advice like "Learn Python" or "Do internships". Give highly specific advice like "Master FastAPI and Pydantic", "Build a distributed cache system in Rust", or "Target Series B climate-tech startups".\nIf they mention specific constraints (e.g. they hate frontend, they want to work in finance), YOU MUST aggressively tailor the roadmap to those constraints.\n\nYou must return the response as a strict JSON object with this exact schema:\n{\n  "recommended_careers": ["string (e.g. 'HFT C++ Engineer', 'Kernel Developer')"],\n  "primary_career": "string",\n  "reasoning": "string (Explain EXACTLY why you chose this based on their constraints. Be opinionated.)",\n  "roadmap": {\n    "skills_to_learn": ["string (Highly specific skills)"],\n    "technologies": ["string (Specific frameworks, libraries, tools)"],\n    "project_ideas": ["string (Non-trivial, resume-worthy project ideas. No to-do lists.)"],\n    "certifications": ["string (Or specify 'None needed for this field' if applicable)"],\n    "internship_advice": "string (Actionable advice tailored to their niche)",\n    "job_titles": ["string (Specific titles to search for)"]\n  }\n}`;

      const systemPrompt = `${config.systemPrompt_roadmap || defaultRoadmapPrompt}\n\nStudent Data:\nBranch: ${branch}\nQuiz Answers: ${JSON.stringify(answers)}\nAdditional Constraints/Info: ${freeText}`;

      try {
        // 3. Call Groq with timeout
        const groqPromise = groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt }
          ],
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
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

// Follow-up Chat Endpoint (Streaming)
router.post('/chat', requireAuth, async (req: any, res: any) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    if (!groq) {
      res.write(`data: ${JSON.stringify({ error: 'AI service offline. Please try fallback resources.' })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
    const { question, roadmapContext } = req.body;

    if (!question || !roadmapContext) {
      res.write(`data: ${JSON.stringify({ error: 'Question and roadmap context are required' })}\n\n`);
      return res.end();
    }

    let config: any = {};
    try {
      const { data } = await supabase.from('system_config').select('config').eq('id', 1).single();
      if (data) config = data.config || {};
    } catch (err) {
      console.error('Error reading config from supabase, using defaults.', err);
    }

    const defaultChatPrompt = `You are a helpful, expert career counselor and technical mentor. 
IMPORTANT RULES:
You are a helpful, expert career counselor and technical mentor. 
IMPORTANT RULES:
1. You MUST ONLY answer questions related to careers, skills, learning, job searching, technology, certifications, projects, internships, and professional development.
2. If the user asks about anything unrelated (e.g. jokes, personal life, politics, entertainment, coding help unrelated to their roadmap, or any off-topic question), respond ONLY with: "I can only help with career and roadmap-related questions. Please ask something about your career path, skills, or learning plan."
3. Keep your answers concise — maximum 150 words unless the user explicitly asks for a detailed explanation.
4. Be actionable and encouraging in your tone.
5. Format your response in plain text (conversational chat style). Do NOT return JSON, MD, tables, or anything that isnt plain text..`;

    const systemPrompt = `${config.systemPrompt_chat || defaultChatPrompt}\n\nYou previously generated the following career roadmap for the user:\n${JSON.stringify(roadmapContext)}`;

    let maxTokens = 500;
    if (config.chat_character_limit) {
      const parsed = parseInt(String(config.chat_character_limit).trim(), 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxTokens = parsed;
      }
    }

    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const stream = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      model,
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ chunk: content })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to generate answer' })}\n\n`);
    res.end();
  }
});

// Weekly Plan Generator Endpoint
router.post('/plan', requireAuth, async (req: any, res: any) => {
  try {
    if (!groq) {
      return res.status(503).json({ error: 'AI service offline. Weekly plan unavailable, use fallback checklist.' });
    }
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

    const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      model,
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

// Update Progress Endpoint (backward compat: supports roadmapId)
router.put('/progress', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const { checkedItems, roadmapId } = req.body; // roadmapId optional

    if (!Array.isArray(checkedItems)) {
      return res.status(400).json({ error: 'checkedItems must be an array' });
    }

    let targetId: string | null = roadmapId || null;
    let targetRoadmap: any = null;

    if (targetId) {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('id, roadmap')
        .eq('id', targetId)
        .eq('user_id', userId)
        .single();
      if (error || !data) return res.status(404).json({ error: 'Roadmap not found' });
      targetRoadmap = data;
      targetId = data.id;
    } else {
      const { data: latestRoadmaps } = await supabase
        .from('roadmaps')
        .select('id, roadmap')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!latestRoadmaps || latestRoadmaps.length === 0) return res.status(404).json({ error: 'No roadmap found' });
      targetRoadmap = latestRoadmaps[0];
      targetId = targetRoadmap.id;
    }

    const updatedRoadmap = { ...targetRoadmap.roadmap, checked_items: checkedItems };
    const { error: updateError } = await supabase
      .from('roadmaps')
      .update({ roadmap: updatedRoadmap })
      .eq('id', targetId);
    if (updateError) throw updateError;

    res.json({ success: true, roadmapId: targetId });
  } catch (error: any) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get Config (Quiz Questions) Endpoint
router.get('/config', requireAuth, async (req: any, res: any) => {
  try {
    const { data, error } = await supabase.from('system_config').select('config').eq('id', 1).single();
    if (error) throw error;
    const config = data?.config || {};
    res.json({ quizQuestions: config.quizQuestions || [] });
  } catch (error) {
    console.error('Error fetching config for quiz:', error);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// Soft Delete Roadmap Endpoint
router.delete('/roadmaps/:id', requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const roadmapId = req.params.id;

    // Fetch existing
    const { data: roadmapData, error: fetchError } = await supabase
      .from('roadmaps')
      .select('roadmap')
      .eq('id', roadmapId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !roadmapData) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Append is_deleted to JSONB
    const updatedRoadmap = { ...roadmapData.roadmap, is_deleted: true };

    const { error: updateError } = await supabase
      .from('roadmaps')
      .update({ roadmap: updatedRoadmap })
      .eq('id', roadmapId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Failed to soft delete roadmap:', updateError);
      return res.status(500).json({ error: 'Failed to soft delete roadmap' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error soft deleting roadmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
