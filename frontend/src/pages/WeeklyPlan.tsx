import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Calendar } from 'lucide-react';

const WeeklyPlan = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const roadmap = location.state?.roadmap;

  useEffect(() => {
    if (!roadmap) {
      navigate('/dashboard');
      return;
    }
    generatePlan();
  }, [roadmap]);

  const generatePlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ roadmapContext: roadmap })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate plan');

      setPlan(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="results-layout" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-state">
          <Loader2 className="spinner" size={48} />
          <p className="loading-text">Generating your 12-week learning plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="alert-error">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="results-layout" style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Roadmap
        </button>
        
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <Calendar size={48} color="hsl(var(--primary))" style={{ margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>12-Week Learning Plan</h1>
          <p className="text-muted">Structured weekly goals based on your customized career roadmap.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {plan?.weeks?.map((week: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card"
              style={{ padding: '2rem', borderLeft: '4px solid hsl(var(--primary))' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'hsl(var(--primary))' }}>Week {week.week_number}</h3>
                <h4 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 500 }}>{week.focus}</h4>
              </div>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: 0, color: 'hsl(var(--muted-foreground))' }}>
                {week.tasks?.map((task: string, i: number) => (
                  <li key={i} style={{ marginBottom: '0.5rem', lineHeight: '1.5' }}>{task}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyPlan;
