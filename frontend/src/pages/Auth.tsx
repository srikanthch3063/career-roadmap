import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Magic Link State
  const [linkSent, setLinkSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

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
          // Switch to magic link success mode
          setLinkSent(true);
          setMessage('a verification link has been sent to your email.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'an error occurred');
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
            <h1>{linkSent ? 'verification' : (isLogin ? 'authenticate' : 'initialize account')}</h1>
            <p>{linkSent ? 'check your inbox for the link.' : (isLogin ? 'enter credentials.' : 'create your identity.')}</p>
          </div>

          {!linkSent && (
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

          {!linkSent ? (
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
                />
              </div>
              
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="eyebrow">password</label>
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

              <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
                {loading ? 'processing...' : (isLogin ? 'authorize' : 'register')}
              </button>
            </form>
          ) : (
            <div className="auth-form" style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button type="button" className="btn btn--outline" onClick={() => { setLinkSent(false); setIsLogin(true); setMessage(null); }}>
                return to login
              </button>
            </div>
          )}

          {!linkSent && (
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
