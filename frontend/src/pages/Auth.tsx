import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Map, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const getURL = () => {
    let url = window.location.origin;
    
    // Make sure to include a trailing `/`
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return `${url}dashboard`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(password)) {
          throw new Error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: getURL(), // Important for magic links/email confirmation
          },
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getURL(), // Uses the bulletproof getURL function
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Google Auth failed');
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* Left Side: Brand & Vibe */}
      <div className="auth-brand-pane">
        <div className="auth-brand-content">
          <div className="auth-logo" onClick={() => navigate('/')}>
            <Map className="icon" size={24} />
            <span>PathForge</span>
          </div>
          
          <div className="auth-testimonial">
            <blockquote>
              "I was lost between three different engineering fields. 
              PathForge didn't just give me advice—it gave me a blueprint."
            </blockquote>
            <div className="auth-testimonial-author">
              <div className="author-avatar">P</div>
              <div>
                <strong>Priya K.</strong>
                <span>Software Engineer at Zepto</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="auth-form-pane">
        <div className="auth-form-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="auth-header">
              <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p className="text-muted">
                {isLogin 
                  ? 'Enter your credentials to access your roadmaps.' 
                  : 'Start mapping your career trajectory today.'}
              </p>
            </div>

            <button 
              className="btn btn-outline btn-social" 
              onClick={handleGoogleLogin}
              disabled={loading}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>Or continue with email</span>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input 
                    className="input"
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="Jane Doe"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="label">Email address</label>
                <input 
                  className="input"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="jane@example.com"
                />
              </div>
              
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="label">Password</label>
                  {isLogin && <a href="#" className="forgot-password">Forgot password?</a>}
                </div>
                <input 
                  className="input"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="auth-toggle">
              <span className="text-muted">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <button className="btn-link" onClick={() => setIsLogin(!isLogin)} type="button">
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
