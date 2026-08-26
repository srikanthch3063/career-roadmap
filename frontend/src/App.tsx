import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import WeeklyPlan from './pages/WeeklyPlan';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import { supabase } from './supabase';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './theme/ThemeProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';

// Loading overlay component
const FullPageSpinner = () => (
  <div style={{ 
    display: 'flex', 
    height: '100vh', 
    width: '100vw',
    alignItems: 'center', 
    justifyContent: 'center', 
    background: 'hsl(var(--background, 222 47% 11%))', 
    color: 'hsl(var(--foreground, 210 40% 98%))',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div className="spinner" style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid rgba(255,255,255,0.1)', 
        borderTopColor: '#0ea5e9', 
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 1.25rem auto'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: '0.85rem', opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Authenticating...</span>
    </div>
  </div>
);

// Protected Route Wrapper
const ProtectedRoute = ({ 
  session, 
  role, 
  loading, 
  adminOnly = false, 
  children 
}: { 
  session: any; 
  role: string | null; 
  loading: boolean; 
  adminOnly?: boolean; 
  children: React.ReactNode; 
}) => {
  if (loading) {
    return <FullPageSpinner />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If session exists, but role is still loading/null, show spinner instead of redirecting to /auth!
  if (!role) {
    return <FullPageSpinner />;
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

// Public Only Route Wrapper (for / and /auth)
const PublicOnlyRoute = ({ 
  session, 
  loading, 
  children 
}: { 
  session: any; 
  loading: boolean; 
  children: React.ReactNode; 
}) => {
  if (loading) {
    return <FullPageSpinner />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track the current user and role in refs to avoid closure staleness and redundant fetches
  const lastUserId = React.useRef<string | null>(null);
  const lastRole = React.useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRole = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        
        if (isMounted) {
          const newRole = (data && data.role) ? data.role : 'student';
          setRole(newRole);
          lastRole.current = newRole;
        }
      } catch (e) {
        console.error('Error fetching role:', e);
        if (isMounted) {
          setRole('student');
          lastRole.current = 'student';
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Single source of truth for Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      
      setSession(currentSession);
      
      if (currentSession) {
        // Prevent infinite loops on mobile if token refresh fires repeatedly
        if (lastUserId.current === currentSession.user.id && lastRole.current !== null) {
           return; // Already loaded role for this user, skip loading
        }
        
        lastUserId.current = currentSession.user.id;
        setLoading(true);
        await fetchRole(currentSession.user.id);
      } else {
        lastUserId.current = null;
        lastRole.current = null;
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      <SplashScreen isAppReady={!loading} />
      <Routes>
        <Route path="/" element={<PublicOnlyRoute session={session} loading={loading}><Landing /></PublicOnlyRoute>} />
        <Route path="/auth" element={<PublicOnlyRoute session={session} loading={loading}><AuthPage /></PublicOnlyRoute>} />
        
        {/* Protected Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute session={session} role={role} loading={loading}><Dashboard /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute session={session} role={role} loading={loading}><Quiz /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute session={session} role={role} loading={loading}><Results /></ProtectedRoute>} />
        <Route path="/weekly-plan" element={<ProtectedRoute session={session} role={role} loading={loading}><WeeklyPlan /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute session={session} role={role} loading={loading}><Profile /></ProtectedRoute>} />
        
        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute session={session} role={role} loading={loading} adminOnly><AdminDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster position="bottom-right" containerStyle={{ zIndex: 99999 }} toastOptions={{ 
          style: { 
            background: 'hsl(var(--card))', 
            color: 'hsl(var(--card-foreground))', 
            border: '1px solid hsl(var(--border))' 
          } 
        }} />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
