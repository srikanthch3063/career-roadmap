import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.SUPABASE_JWT_SECRET || '';

// Initialize Supabase with the service role key to bypass RLS for server-side checks
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT server-side securely using Supabase Admin client
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(token);

    if (verifyError || !user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const userId = user.id;

    // Read the role + blocked status FROM DB using service_role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_blocked')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      res.status(401).json({ error: 'User profile not found in database' });
      return;
    }

    if ((profile as any).is_blocked) {
      res.status(403).json({ error: 'Your account has been blocked. Contact support.' });
      return;
    }

    // Attach user to request
    req.user = {
      id: userId,
      role: profile.role,
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    
    // Make error explicit as requested
    let errorMessage = 'Invalid or expired token';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Your login session has expired. Please log out and log in again.';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = `Invalid token signature. Your SUPABASE_JWT_SECRET might be incorrect. Detail: ${error.message}`;
    } else if (error.message) {
      errorMessage = `Authentication failed: ${error.message}`;
    }

    res.status(401).json({ error: errorMessage });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin privileges required' });
    return;
  }

  next();
};
