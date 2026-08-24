import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Map, Printer, CheckCircle2, Circle, 
  Search, Code2, Briefcase, GraduationCap,
  Loader2, X, ExternalLink, Lightbulb, Share2, MessageSquare, Calendar, ChevronRight, Download, Hexagon, Menu
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ThemeToggle from '../components/ThemeToggle';
import ChatDrawer from '../components/ChatDrawer';
import salaryData from '../data/salaryData.json';
import { generateResourceLinks } from '../utils/resourceResolver';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const loadingMessages = [
    "calibrating constraints...",
    "consulting knowledge graphs...",
    "synthesizing trajectory..."
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

      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
      const response = await fetch(`${apiUrl}/generate-roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'generation failed');

      setRoadmap(data);
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
      
      await fetch(`${import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api')}/progress`, {
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
    toast.loading('exporting document...', { id: 'pdf', style: { borderRadius: 0, background: 'var(--color-paper-2)', color: 'var(--color-paper-contrast)', border: '1px solid var(--color-rule)' } });
    
    const originalElement = contentRef.current;
    
    // Save original styles
    const originalStyle = {
      width: originalElement.style.width,
      margin: originalElement.style.margin,
      overflow: originalElement.style.overflow,
      maxHeight: originalElement.style.maxHeight,
      maxWidth: originalElement.style.maxWidth
    };
    
    try {
      // Temporarily modify original element for perfect capture
      originalElement.style.width = '794px'; // A4 width
      originalElement.style.maxWidth = 'none';
      originalElement.style.margin = '0';
      originalElement.style.overflow = 'visible';
      originalElement.style.maxHeight = 'none';
      
      // Wait for layout recalculation
      await new Promise(resolve => setTimeout(resolve, 50));

      const canvas = await html2canvas(originalElement, { 
        scale: 2, 
        backgroundColor: '#0a0a0a',
        useCORS: true,
        logging: false,
        windowWidth: 794,
        scrollY: 0
      });
      
      // Immediately restore styles
      Object.assign(originalElement.style, originalStyle);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let heightLeft = pdfHeight - pageHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('career_roadmap.pdf');
      toast.success('export complete.', { id: 'pdf' });
    } catch (e: any) {
      console.error('PDF Export Error:', e);
      // Immediately restore styles on error
      Object.assign(originalElement.style, originalStyle);
      toast.error(`export failed: ${e.message || String(e)}`, { id: 'pdf' });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('link copied.');
    } catch {
      toast.error('clipboard error.');
    }
  };

  if (loading) {
    return (
      <div className="lumen-workbench" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-state">
          <div className="round-loader" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', margin: 0 }}>{loadingMessages[loadingPhase]}</h2>
          <p className="text-muted" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>this process requires intensive computation. please wait.</p>
        </div>
      </div>
    );
  }

  const renderChecklist = (items: string[], prefix: string) => (
    <div className="lumen-checklist">
      {items.map((item: string, i: number) => {
        const id = `${prefix}-${i}`;
        const isChecked = checkedItems[id];
        return (
          <div key={i} className={`lumen-check-item ${isChecked ? 'is-checked' : ''}`} onClick={() => toggleCheck(id)}>
            <div className="lumen-check-box">
              {isChecked ? <div className="lumen-check-fill"></div> : null}
            </div>
            <span className="lumen-check-text">{item}</span>
            {prefix === 'tech' && !isChecked && (
              <button className="btn-resource-action" onClick={(e) => { e.stopPropagation(); setSelectedResource(item); }}>
                Resources &rarr;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="lumen-workbench">
      {/* Mobile Sidebar Overlay/Toggle */}
      <button 
        className="mobile-menu-toggle" 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        <Menu size={24} />
      </button>

      {isMobileMenuOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}
      {/* Sidebar Navigation */}
      <aside className={`lumen-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button 
          className="mobile-close-btn"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{display:'none'}}
          aria-label="Close Menu"
        >
          ✕
        </button>
        <div className="lumen-sidebar__brand" onClick={() => navigate('/dashboard')}>
          <Map size={18} />
          <span className="wordmark">pathforge</span>
        </div>
        
        <nav className="lumen-sidebar__nav">
          <button className="nav-item" onClick={() => { setIsMobileMenuOpen(false); navigate('/weekly-plan', { state: { roadmap } }); }}>
            <Calendar size={16} /> <span>12-week schedule</span>
          </button>
          
          <button className="nav-item" onClick={() => { setIsMobileMenuOpen(false); setIsChatOpen(true); }}>
            <MessageSquare size={16} /> <span>ai mentor</span>
          </button>
        </nav>

        <div className="lumen-sidebar__footer">
          <ThemeToggle />
          <button className="nav-item" onClick={handleShare}>
            <Share2 size={16} /> <span>share link</span>
          </button>
          <button className="nav-item" onClick={handleExportPDF}>
            <Download size={16} /> <span>export pdf</span>
          </button>
          <button className="nav-item text-muted" onClick={() => navigate('/dashboard')}>
            <ChevronRight size={16} /> <span>return to console</span>
          </button>
        </div>
      </aside>

      {/* Main Document Content */}
      <main className="lumen-main document-main">
        {error && (
          <div className="alert alert--error" style={{ marginBottom: '2rem' }}>
            {error} <button className="btn btn-link" onClick={generateRoadmap}>retry_</button>
          </div>
        )}

        {roadmap && roadmap.primary_career && (
          <div className="lumen-document" ref={contentRef}>
            {/* Header / Title block */}
            <header className="document-header">
              <span className="eyebrow">TARGET TRAJECTORY</span>
              <h1 className="document-title">{roadmap.primary_career.toLowerCase()}</h1>
              
              <div className="document-meta">
                {(salaryData as Record<string, any>)[roadmap.primary_career] && (
                  <span className="badge badge--success">
                    est_comp: {(salaryData as Record<string, any>)[roadmap.primary_career].india}
                  </span>
                )}
                {roadmap.recommended_careers?.slice(0,2).map((c: string) => (
                  <span key={c} className="badge">alt: {c.toLowerCase()}</span>
                ))}
              </div>
            </header>

            {/* Reasoning Block */}
            <section className="document-section rationale-section">
              <div className="section-header">
                <Hexagon size={16} className="text-accent"/>
                <h2 className="section-title">architectural rationale</h2>
              </div>
              <p className="document-body">{roadmap.reasoning}</p>
            </section>

            {/* Grid for Technical Details */}
            <div className="document-grid">
              <section className="document-section">
                <div className="section-header">
                  <Code2 size={16} className="text-rule"/>
                  <h3 className="section-title">technology stack</h3>
                </div>
                {renderChecklist(roadmap.roadmap?.technologies || [], 'tech')}
              </section>

              <section className="document-section">
                <div className="section-header">
                  <CheckCircle2 size={16} className="text-rule"/>
                  <h3 className="section-title">core competencies</h3>
                </div>
                {renderChecklist(roadmap.roadmap?.skills_to_learn || [], 'skill')}
              </section>

              <section className="document-section full-width">
                <div className="section-header">
                  <Lightbulb size={16} className="text-accent"/>
                  <h3 className="section-title">portfolio architecture</h3>
                </div>
                {renderChecklist(roadmap.roadmap?.project_ideas || [], 'proj')}
              </section>

              <section className="document-section">
                <div className="section-header">
                  <Briefcase size={16} className="text-rule"/>
                  <h3 className="section-title">market strategy</h3>
                </div>
                <p className="document-body text-sm mb-4">{roadmap.roadmap?.internship_advice}</p>
                <div className="document-tags">
                  {roadmap.roadmap?.job_titles?.map((t: string) => <span key={t} className="badge">{t.toLowerCase()}</span>)}
                </div>
              </section>

              <section className="document-section">
                <div className="section-header">
                  <GraduationCap size={16} className="text-rule"/>
                  <h3 className="section-title">validation / certs</h3>
                </div>
                {renderChecklist(roadmap.roadmap?.certifications || [], 'cert')}
              </section>
            </div>
            
            <footer className="document-footer">
              <span className="eyebrow">GENERATED BY PATHFORGE INTELLIGENCE</span>
            </footer>
          </div>
        )}
      </main>

      {/* Resource Modal */}
      <AnimatePresence>
        {selectedResource && (
          <div className="modal-overlay" onClick={() => setSelectedResource(null)}>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="btn-icon" style={{ position: 'absolute', top: '1rem', right: '1rem' }} onClick={() => setSelectedResource(null)}><X size={16} /></button>
              <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>resource query: <span className="text-accent">{selectedResource.toLowerCase()}</span></h3>
              <p className="text-muted mb-6">select a destination to query knowledge paths.</p>
              
              <div className="resource-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {generateResourceLinks(selectedResource).map((resource, i) => (
                  <a key={i} href={resource.url} target="_blank" rel="noopener noreferrer" className="btn btn--outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{resource.title}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'none', letterSpacing: 'normal' }}>{resource.description}</span>
                    </div>
                    <ExternalLink size={16} />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} roadmapContext={roadmap} />
    </div>
  );
};

export default Results;
