import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import './Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  
  // Verification State
  const [linkSent, setLinkSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // Security State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (lockoutTime > 0) {
      timer = setInterval(() => setLockoutTime((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  const getURL = () => {
    let url = window.location.origin;
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
    return `${url}dashboard`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!email.trim() || (!isForgotPassword && !password.trim())) {
        setError('Email and password fields cannot be empty.');
        setLoading(false);
        return;
      }

      if (isLogin && !isForgotPassword) {
        if (lockoutTime > 0) throw new Error(`too many attempts. try again in ${lockoutTime}s.`);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setFailedAttempts(prev => {
            const newAttempts = prev + 1;
            if (newAttempts >= 5) setLockoutTime(60);
            return newAttempts;
          });
          throw error;
        }
        setFailedAttempts(0);
        navigate('/dashboard');
      } else if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getURL(),
        });
        if (error) throw error;
        setMessage('password reset link sent to your email.');
        setIsForgotPassword(false);
        return;
      } else {
        if (password !== confirmPassword) {
          throw new Error('passwords do not match.');
        }
        const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passRegex.test(password)) {
          throw new Error('password must be at least 8 chars, include uppercase, lowercase, number, and special character.');
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: getURL(),
          },
        });
        if (error) throw error;
        
        if (data.session) {
          navigate('/dashboard');
        } else {
          // Switch to OTP verification mode
          setLinkSent(true);
          setMessage('a 6-digit verification code has been sent to your email.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'an error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup'
      });
      if (error) throw error;
      
      if (data.session) {
        // Send welcome email in background
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        fetch(`${apiUrl}/api/auth/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: name || 'Explorer' })
        }).catch(err => console.error('Failed to trigger welcome email', err));
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'verification failed. please check the code.');
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
          redirectTo: getURL(),
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'google auth failed');
      setLoading(false);
    }
  };

  return (
    <div className="lumen-auth">
      {/* Left side visual */}
      <div className="auth-visual">
        <div className="auth-visual__inner">
          <span className="eyebrow" style={{marginBottom: '2rem', display: 'block'}}>00 · ACCESS</span>
          <h2 className="auth-visual__title">
            the roadmap<br/>is <em>ready</em>.
          </h2>
          
          <div className="auth-visual__apparatus">
            <div className="diagram">
              <span className="diagram__node"></span>
              <span className="diagram__line"></span>
              <span className="diagram__node"></span>
            </div>
            <ul className="callouts">
              <li className="callout" style={{'--side': 'right', '--y': '30%'} as any}><span>SECURE · SSL</span></li>
              <li className="callout" style={{'--side': 'right', '--y': '70%'} as any}><span>ENV · PROD</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="auth-form-side">
        <div className="auth-form__inner">
          <div className="auth-header">
            <h1>{isForgotPassword ? 'reset password' : (linkSent ? 'verification' : (isLogin ? 'authenticate' : 'initialize account'))}</h1>
            <p>{isForgotPassword ? 'enter your email to receive a reset link.' : (linkSent ? 'enter the 6-digit code sent to your inbox.' : (isLogin ? 'enter credentials.' : 'create your identity.'))}</p>
          </div>

          {!linkSent && !isForgotPassword && (
            <>
              <button 
                className="btn btn--outline btn-social" 
                onClick={handleGoogleLogin}
                disabled={loading}
                type="button"
              >
                continue with google
              </button>

              <div className="auth-divider">
                <span>or with email</span>
              </div>
            </>
          )}

          {error && <div className="alert alert--error">{error}</div>}
          {message && <div className="alert alert--success">{message}</div>}

          {isForgotPassword ? (
            <form onSubmit={handleAuth} className="auth-form">
              <div className="form-group">
                <label className="eyebrow">email address</label>
                <input 
                  className="input"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
                {loading ? 'processing...' : 'send reset link'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button type="button" className="btn-link" onClick={() => setIsForgotPassword(false)}>
                  ← return to login
                </button>
              </div>
            </form>
          ) : !linkSent ? (
            <form onSubmit={handleAuth} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label className="eyebrow">full name</label>
                  <input 
                    className="input"
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="name"
                    autoComplete="name"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="eyebrow">email address</label>
                  <input 
                    className="input"
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="username"
                  />
              </div>
              
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="eyebrow">password</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    className="input"
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="eyebrow">confirm password</label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="input"
                      type={showPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      autoComplete="new-password"
                      style={{ paddingRight: '2.5rem' }}
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                  <button type="button" className="btn-link" onClick={() => setIsForgotPassword(true)}>
                    forgot password?
                  </button>
                </div>
              )}

              <button type="submit" className="btn btn--primary auth-submit" disabled={loading || lockoutTime > 0}>
                {loading ? 'processing...' : (lockoutTime > 0 ? `locked (${lockoutTime}s)` : (isLogin ? 'authorize' : 'register'))}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="form-group">
                <label className="eyebrow">verification code</label>
                <input 
                  className="input"
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="123456"
                  maxLength={6}
                  style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }}
                />
              </div>
              <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
                {loading ? 'verifying...' : 'verify account'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button type="button" className="btn-link" onClick={() => { setLinkSent(false); setIsLogin(true); setMessage(null); setOtp(''); }}>
                  ← return to login
                </button>
              </div>
            </form>
          )}

          {!linkSent && !isForgotPassword && (
            <div className="auth-toggle">
              <span>
                {isLogin ? "don't have an account? " : "already have an account? "}
              </span>
              <button className="btn-link" onClick={() => setIsLogin(!isLogin)} type="button">
                {isLogin ? 'sign up' : 'log in'}
              </button>
            </div>
          )}
          
          <button className="btn-link btn-back" onClick={() => navigate('/')}>
            ← return to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
