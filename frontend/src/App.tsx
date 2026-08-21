import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import WeeklyPlan from './pages/WeeklyPlan';
import AdminDashboard from './pages/AdminDashboard';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './theme/ThemeProvider';

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchRole(session.user.id);
      } else {
        setRole(null);
        setLoading(false);
      }
    });
  }, []);

  const fetchRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (data) setRole(data.role);
    setLoading(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>Loading...</div>;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!session ? <Landing /> : <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} />} />
          <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to={role === 'admin' ? '/admin' : '/dashboard'} />} />
          
          {/* Protected Student Routes (Admins can access too) */}
          <Route path="/dashboard" element={session && (role === 'student' || role === 'admin') ? <Dashboard /> : <Navigate to="/auth" />} />
          <Route path="/quiz" element={session && (role === 'student' || role === 'admin') ? <Quiz /> : <Navigate to="/auth" />} />
          <Route path="/results" element={session && (role === 'student' || role === 'admin') ? <Results /> : <Navigate to="/auth" />} />
          <Route path="/weekly-plan" element={session && (role === 'student' || role === 'admin') ? <WeeklyPlan /> : <Navigate to="/auth" />} />
          
          {/* Protected Admin Routes */}
          <Route path="/admin" element={session && role === 'admin' ? <AdminDashboard /> : <Navigate to="/auth" />} />
        </Routes>
        <Toaster position="bottom-right" toastOptions={{ 
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
