import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Map, Printer, CheckCircle2, Circle, 
  Search, Code2, Briefcase, GraduationCap,
  Loader2, X, ExternalLink, Lightbulb, Share2, MessageSquare, Calendar, ChevronRight, Download
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
  const contentRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    "Analyzing your constraints and goals...",
    "Consulting AI models for tailored advice...",
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
        colors: ['#8b5cf6', '#3b82f6', '#10b981']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8b5cf6', '#3b82f6', '#10b981']
      });

      if (Date.now() < end) requestAnimationFrame(frame);
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
    if (!contentRef.current) return;
    toast.loading('Generating blueprint...', { id: 'pdf' });
    try {
      const canvas = await html2canvas(contentRef.current, { scale: 2, backgroundColor: '#000000' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('PathForge_Blueprint.pdf');
      toast.success('Downloaded successfully', { id: 'pdf' });
    } catch (e) {
      toast.error('Failed to export', { id: 'pdf' });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  if (loading) {
    return (
      <div className="results-loading">
        <Loader2 className="spin icon-xl" />
        <h2>{loadingMessages[loadingPhase]}</h2>
        <p className="text-muted">High-quality roadmaps take about 10-20 seconds.</p>
      </div>
    );
  }

  const renderChecklist = (items: string[], prefix: string) => (
    <div className="blueprint-checklist">
      {items.map((item: string, i: number) => {
        const id = `${prefix}-${i}`;
        const isChecked = checkedItems[id];
        return (
          <div key={i} className={`blueprint-check-item ${isChecked ? 'checked' : ''}`} onClick={() => toggleCheck(id)}>
            <div className="blueprint-check-icon">
              {isChecked ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </div>
            <span className="blueprint-check-text">{item}</span>
            {prefix === 'tech' && !isChecked && (
              <button className="blueprint-resource-btn" onClick={(e) => { e.stopPropagation(); setSelectedResource(item); }}>
                <Search size={14} /> Find Resources
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="document-layout">
      {/* Sidebar Navigation */}
      <aside className="document-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
          <Map className="brand-icon" size={24} />
          <span className="brand-text">PathForge</span>
        </div>
        
        <div className="sidebar-actions">
          <button className="btn btn-primary w-full" onClick={() => navigate('/weekly-plan', { state: { roadmap } })}>
            <Calendar size={16} /> Generate 12-Week Plan
          </button>
          
          <button className="btn btn-outline w-full" onClick={() => setIsChatOpen(true)}>
            <MessageSquare size={16} /> Ask AI Mentor
          </button>
          
          <hr className="sidebar-divider" />
          
          <button className="btn-ghost w-full justify-start" onClick={handleShare}>
            <Share2 size={16} /> Share Link
          </button>
          <button className="btn-ghost w-full justify-start" onClick={handleExportPDF}>
            <Download size={16} /> Export PDF
          </button>
          <button className="btn-ghost w-full justify-start" onClick={() => navigate('/dashboard')}>
            <ChevronRight size={16} /> Back to Dashboard
          </button>
        </div>
      </aside>

      {/* Main Document Content */}
      <main className="document-main">
        {error && (
          <div className="alert alert-error mb-8">
            {error} <button className="btn btn-outline btn-sm ml-4" onClick={generateRoadmap}>Retry</button>
          </div>
        )}

        {roadmap && roadmap.primary_career && (
          <div className="blueprint-document" ref={contentRef}>
            {/* Header / Title block */}
            <header className="blueprint-header">
              <span className="blueprint-eyebrow">Career Trajectory Analysis</span>
              <h1 className="blueprint-title">{roadmap.primary_career}</h1>
              
              <div className="blueprint-meta">
                {(salaryData as Record<string, any>)[roadmap.primary_career] && (
                  <span className="blueprint-badge success">
                    Compensation Est: {(salaryData as Record<string, any>)[roadmap.primary_career].india}
                  </span>
                )}
                {roadmap.recommended_careers.slice(0,2).map((c: string) => (
                  <span key={c} className="blueprint-badge default">Alt: {c}</span>
                ))}
              </div>
            </header>

            {/* Reasoning Block */}
            <section className="blueprint-section rationale-section">
              <h2 className="blueprint-h2">Architectural Rationale</h2>
              <p className="blueprint-p">{roadmap.reasoning}</p>
            </section>

            {/* Grid for Technical Details */}
            <div className="blueprint-grid">
              <section className="blueprint-section">
                <h3 className="blueprint-h3"><Code2 size={18}/> Technology Stack</h3>
                {renderChecklist(roadmap.roadmap.technologies, 'tech')}
              </section>

              <section className="blueprint-section">
                <h3 className="blueprint-h3"><CheckCircle2 size={18}/> Core Competencies</h3>
                {renderChecklist(roadmap.roadmap.skills_to_learn, 'skill')}
              </section>

              <section className="blueprint-section full-width">
                <h3 className="blueprint-h3"><Lightbulb size={18}/> Portfolio Architecture (Projects)</h3>
                {renderChecklist(roadmap.roadmap.project_ideas, 'proj')}
              </section>

              <section className="blueprint-section">
                <h3 className="blueprint-h3"><Briefcase size={18}/> Market Strategy</h3>
                <p className="blueprint-p text-sm">{roadmap.roadmap.internship_advice}</p>
                <div className="blueprint-tags mt-4">
                  {roadmap.roadmap.job_titles.map((t: string) => <span key={t} className="blueprint-tag">{t}</span>)}
                </div>
              </section>

              <section className="blueprint-section">
                <h3 className="blueprint-h3"><GraduationCap size={18}/> Validation (Certifications)</h3>
                {renderChecklist(roadmap.roadmap.certifications, 'cert')}
              </section>
            </div>
            
            <footer className="blueprint-footer">
              Generated by PathForge Intelligence
            </footer>
          </div>
        )}
      </main>

      {/* Resource Modal */}
      <AnimatePresence>
        {selectedResource && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="resource-modal-overlay" onClick={() => setSelectedResource(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="resource-modal" onClick={e => e.stopPropagation()}>
              <button className="resource-modal-close" onClick={() => setSelectedResource(null)}><X size={20} /></button>
              <h3>Resource Locator: {selectedResource}</h3>
              <p className="text-muted mb-6">Select a destination to query knowledge paths.</p>
              
              <div className="resource-links">
                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedResource + ' tutorial for beginners')}`} target="_blank" rel="noreferrer" className="resource-btn">
                  YouTube <ExternalLink size={16} />
                </a>
                <a href={`https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(selectedResource)}`} target="_blank" rel="noreferrer" className="resource-btn">
                  freeCodeCamp <ExternalLink size={16} />
                </a>
                <a href={`https://roadmap.sh/search?q=${encodeURIComponent(selectedResource)}`} target="_blank" rel="noreferrer" className="resource-btn">
                  Roadmap.sh <ExternalLink size={16} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} roadmapContext={roadmap} />
    </div>
  );
};

export default Results;
