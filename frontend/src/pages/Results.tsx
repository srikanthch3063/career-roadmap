import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Map, Printer, CheckCircle2, Circle, 
  Search, Code2, Briefcase, GraduationCap,
  Loader2, X, ExternalLink, Lightbulb, Share2, MessageSquare, Calendar
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ThemeToggle from '../components/ThemeToggle';
import ChatDrawer from '../components/ChatDrawer';
import salaryData from '../data/salaryData.json';
import './Results.css';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const loadingMessages = [
    "Analyzing your constraints and goals...",
    "Consulting GPT-OSS 120B for tailored advice...",
    "Crafting your personalized career blueprint..."
  ];

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingPhase((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const generate = params.get('generate');
    const roadmapId = params.get('id');

    if (generate === 'true') {
      generateRoadmap();
    } else if (roadmapId) {
      fetchRoadmap(roadmapId);
    } else {
      fetchLatestRoadmap();
    }
  }, [location.search]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#a855f7', '#6366f1', '#3b82f6', '#22d3ee']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#a855f7', '#6366f1', '#ec4899', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const fetchLatestRoadmap = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; 

      if (data) {
        setRoadmap(data.roadmap);
        if (data.roadmap.checked_items) {
          const initialChecked: Record<string, boolean> = {};
          data.roadmap.checked_items.forEach((item: string) => {
            initialChecked[item] = true;
          });
          setCheckedItems(initialChecked);
        }
      } else {
        navigate('/quiz');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoadmap = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRoadmap(data.roadmap);
      if (data.roadmap.checked_items) {
        const initialChecked: Record<string, boolean> = {};
        data.roadmap.checked_items.forEach((item: string) => {
          initialChecked[item] = true;
        });
        setCheckedItems(initialChecked);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    setLoading(true);
    setLoadingPhase(0);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Generation failed');

      // The API returns the full roadmap object directly
      setRoadmap(data);
      triggerConfetti();
      navigate('/results', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = async (id: string) => {
    const newChecked = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(newChecked);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const checkedArray = Object.keys(newChecked).filter(k => newChecked[k]);
      
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ checkedItems: checkedArray })
      });
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('roadmap-content');
    if (!element) return;
    
    toast.loading('Generating PDF...', { id: 'pdf-toast' });
    try {
      // Temporarily add a class for PDF styling if needed, but let's just render it
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: document.documentElement.getAttribute('data-theme') === 'light' ? '#ffffff' : '#1E1E2E' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Career_Roadmap.pdf');
      toast.success('PDF Downloaded!', { id: 'pdf-toast' });
    } catch (e) {
      toast.error('Failed to generate PDF', { id: 'pdf-toast' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Could not copy link. Try copying the URL manually.');
    }
  };

  if (loading) {
    return (
      <div className="results-layout">
        <main className="container results-main" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
          <div className="loading-state" style={{ width: '100%' }}>
            <Loader2 className="spinner" size={48} />
            <p className="loading-text">{loadingMessages[loadingPhase]}</p>
            <p className="text-muted">High-quality roadmaps take about 10 seconds.</p>
          </div>
        </main>
      </div>
    );
  }

  const renderChecklist = (items: string[], prefix: string) => (
    <div className="checklist">
      {items.map((item: string, i: number) => {
        const id = `${prefix}-${i}`;
        const isChecked = checkedItems[id];
        return (
          <div 
            key={i} 
            className={`check-item ${isChecked ? 'is-checked' : ''}`}
            onClick={() => toggleCheck(id)}
          >
            {isChecked ? <CheckCircle2 className="check-icon" size={20} color="hsl(var(--success))" /> : <Circle className="check-icon" size={20} />}
            <span className="check-text">{item}</span>
            {prefix === 'tech' && !isChecked && (
              <button 
                className="resource-link"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedResource(item);
                }}
              >
                <Search size={14} /> Find Resources
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderRoadmapContent = () => {
    if (!roadmap) return null;
    
    if (roadmap.primary_career && roadmap.roadmap) {
      return (
        <div className="roadmap-sections" id="roadmap-content" style={{ padding: '20px', borderRadius: '12px', background: 'hsl(var(--background))' }}>
          <motion.div 
            className="roadmap-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="card module-card" style={{ borderTop: '4px solid hsl(var(--primary))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{roadmap.primary_career}</h2>
                {(salaryData as Record<string, any>)[roadmap.primary_career] && (
                  <div className="badge" style={{ backgroundColor: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))', fontSize: '1rem', padding: '0.5rem 1rem' }}>
                    💰 {(salaryData as Record<string, any>)[roadmap.primary_career].india}
                  </div>
                )}
              </div>
              <p className="text-muted" style={{ lineHeight: '1.6' }}>{roadmap.reasoning}</p>
              
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))', marginBottom: '0.75rem' }}>Alternative Paths</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {roadmap.recommended_careers.map((career: string) => (
                    <span key={career} className="badge">{career}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="roadmap-section"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
            }}
          >
            <h3 className="roadmap-section-title">
              <Code2 size={24} /> The Blueprint
            </h3>
            <div className="bento-grid">
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card module-card">
                <h4><CheckCircle2 size={18} color="hsl(var(--success))"/> Skills to Master</h4>
                {renderChecklist(roadmap.roadmap.skills_to_learn, 'skill')}
              </motion.div>
              
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card module-card">
                <h4><Code2 size={18} color="hsl(var(--info))"/> Tech Stack</h4>
                {renderChecklist(roadmap.roadmap.technologies, 'tech')}
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card module-card">
                <h4><Lightbulb size={18} color="hsl(var(--warning))"/> Portfolio Projects</h4>
                {renderChecklist(roadmap.roadmap.project_ideas, 'proj')}
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card module-card">
                <h4><GraduationCap size={18} color="hsl(var(--accent))"/> Certifications</h4>
                {renderChecklist(roadmap.roadmap.certifications, 'cert')}
              </motion.div>
            </div>
          </motion.div>

          <motion.div 
            className="roadmap-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="card module-card">
              <h4><Briefcase size={18} color="hsl(var(--primary))"/> Internship & Job Strategy</h4>
              <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>{roadmap.roadmap.internship_advice}</p>
              
              <h4 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '0.75rem' }}>Target Job Titles</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {roadmap.roadmap.job_titles.map((j: string) => (
                  <span key={j} className="badge" style={{ backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                    {j}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      );
    }
    
    return (
      <div className="card module-card markdown-content">
        <p>Your roadmap data is in a legacy or unformatted state.</p>
        <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', fontSize: '0.875rem' }}>
          {JSON.stringify(roadmap, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="results-layout">
      <nav className="results-nav">
        <div className="container nav-content">
          <div className="nav-brand">
            <Map className="icon" size={24} />
            <span>Career Roadmap</span>
          </div>
          <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <ThemeToggle />
            <button className="btn btn-outline" onClick={() => navigate('/weekly-plan', { state: { roadmap } })}>
              <Calendar size={16} style={{ marginRight: '0.5rem' }} /> 12-Week Plan
            </button>
            <button className="btn btn-outline" onClick={() => setIsChatOpen(true)}>
              <MessageSquare size={16} style={{ marginRight: '0.5rem' }} /> Ask AI
            </button>
            <button className="btn btn-outline" onClick={handleShare}>
              <Share2 size={16} style={{ marginRight: '0.5rem' }} /> Share
            </button>
            <button className="btn btn-outline" onClick={handleExportPDF}>
              <Printer size={16} style={{ marginRight: '0.5rem' }} /> Export PDF
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="container results-main">
        {error && (
          <div className="alert-error" style={{ marginBottom: '2rem' }}>
            <strong>Error:</strong> {error}
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={generateRoadmap}>Try Again</button>
            </div>
          </div>
        )}

        <div className="results-header">
          <h1>Your Career Roadmap</h1>
          <p>An interactive, highly-opinionated guide to your future.</p>
        </div>

        {!error && roadmap && renderRoadmapContent()}
        
        {!error && roadmap && (
          <div className="action-buttons" style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem', borderTop: '1px solid hsl(var(--border))' }}>
            <h3 style={{ marginBottom: '1rem' }}>Want a different perspective?</h3>
            <button className="btn btn-primary" onClick={generateRoadmap} disabled={loading}>
              Regenerate Roadmap
            </button>
          </div>
        )}
      </main>

      {/* Resource Modal */}
      {selectedResource && (
        <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedResource(null)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Learn {selectedResource}</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Select a platform to search for the best tutorials and documentation.
            </p>
            <div className="modal-links">
              <a 
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedResource + ' tutorial for beginners')}`} 
                target="_blank" 
                rel="noreferrer"
                className="modal-btn"
              >
                <span>YouTube Tutorials</span>
                <ExternalLink size={16} />
              </a>
              <a 
                href={`https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(selectedResource)}`} 
                target="_blank" 
                rel="noreferrer"
                className="modal-btn"
              >
                <span>freeCodeCamp Articles</span>
                <ExternalLink size={16} />
              </a>
              <a 
                href={`https://roadmap.sh/search?q=${encodeURIComponent(selectedResource)}`} 
                target="_blank" 
                rel="noreferrer"
                className="modal-btn"
              >
                <span>Roadmap.sh Guides</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      <ChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        roadmapContext={roadmap} 
      />
    </div>
  );
};

export default Results;
