import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import roadmapRoutes from './routes/roadmap';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import supportRoutes from './routes/support';
import { errorHandler, notFoundHandler } from './middleware/error';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// Security Headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));

app.use(express.json());

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(globalLimiter);

// Routes
app.use('/api', roadmapRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/support', supportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public Config (for Landing Page CMS)
app.get('/api/config/landing', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.from('system_config').select('config').eq('id', 1).single();
    if (error) throw error;
    res.json(data?.config?.landing_page || {});
  } catch (error) {
    console.error('Error fetching landing config:', error);
    res.status(500).json({ error: 'Failed to read config' });
  }
});

// 404 + global error handler (must be after routes)
app.use(notFoundHandler);
app.use(errorHandler);

// Only listen on a port during local development
// Vercel imports this file as a serverless function
if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
  });
}

export default app;
