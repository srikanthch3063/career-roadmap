import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import roadmapRoutes from './routes/roadmap';
import adminRoutes from './routes/admin';

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Only listen on a port during local development
// Vercel imports this file as a serverless function
if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
  });
}

export default app;
