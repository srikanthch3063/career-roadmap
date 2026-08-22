import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Calendar, Map, ChevronRight, Terminal, Download } from 'lucide-react';

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

      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
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

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="lumen-workbench" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-state">
          <Terminal className="spin" size={24} style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>structuring timeline.</h2>
          <p className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>compiling 12-week schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lumen-workbench">
      <aside className="lumen-sidebar">
        <div className="lumen-sidebar__brand" onClick={() => navigate('/dashboard')}>
          <Map size={18} />
          <span className="wordmark">pathforge</span>
        </div>
        
        <nav className="lumen-sidebar__nav">
          <button className="nav-item active">
            <Calendar size={16} /> <span>12-week schedule</span>
          </button>
        </nav>

        <div className="lumen-sidebar__footer">
          <button className="nav-item" onClick={handleExportPDF}>
            <Download size={16} /> <span>export pdf</span>
          </button>
          <button className="nav-item text-muted" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> <span>back to document</span>
          </button>
        </div>
      </aside>

      <main className="lumen-main document-main">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: '2rem' }}>
            {error} <button className="btn btn-link" onClick={() => navigate(-1)}>return_</button>
          </div>
        )}

        {plan && (
          <div className="lumen-document">
            <header className="document-header">
              <span className="eyebrow">TARGET SCHEDULE</span>
              <h1 className="document-title">12-week timeline.</h1>
              <p className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>structured execution blueprint derived from the target trajectory.</p>
            </header>

            <div className="timeline-container" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {plan?.weeks?.map((week: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{ display: 'flex', gap: '2rem' }}
                >
                  <div style={{ flexShrink: 0, width: '100px', borderRight: '1px solid var(--color-rule)', paddingRight: '2rem', textAlign: 'right' }}>
                    <span className="eyebrow" style={{ color: 'var(--color-accent)' }}>WEEK {week.week_number < 10 ? `0${week.week_number}` : week.week_number}</span>
                  </div>
                  
                  <div style={{ flex: 1, paddingBottom: '3rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--color-paper-contrast)' }}>
                      {week.focus.toLowerCase()}
                    </h3>
                    <ul className="lumen-checklist" style={{ gap: '0.75rem' }}>
                      {week.tasks?.map((task: string, i: number) => (
                        <li key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                          <ChevronRight size={16} className="text-rule" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: '1.5', color: 'var(--color-paper-contrast)' }}>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WeeklyPlan;
