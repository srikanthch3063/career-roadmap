import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Users, BookOpen, Target, LogOut, Shield, Key, Trash2, Eye, EyeOff, Terminal, Compass, Settings, Save, Search, Download, BarChart2, Filter, Hexagon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import Landing, { DEFAULT_LANDING_CONFIG } from './Landing';
import './Dashboard.css';

interface Stats {
  total_students: number;
  total_roadmaps: number;
  most_common_branch: string;
  most_common_career: string;
  funnel: {
    signed_up: number;
    took_quiz: number;
    generated_roadmap: number;
  };
  daily_signups: { date: string; count: number }[];
  word_cloud: { text: string; value: number }[];
}

interface Student {
  id: string;
  name: string;
  email: string;
  branch: string;
  primary_career: string;
  created_at: string;
}

interface StudentDetails {
  profile: any;
  quizResponses: any[];
  roadmaps: any[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [originalConfig, setOriginalConfig] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'config' | 'credentials' | 'tickets' | 'landing'>('overview');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Detail View State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const credentials = [
    { label: 'supabase url', key: 'SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL || 'Not set' },
    { label: 'supabase anon key', key: 'VITE_SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY || 'Not set' },
    { label: 'api base url', key: 'VITE_API_BASE_URL', value: import.meta.env.VITE_API_BASE_URL || 'Not set' },
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
      
      const [statsRes, configRes, ticketsRes] = await Promise.all([
        fetch(`${apiUrl}/admin/stats`, { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
        fetch(`${apiUrl}/admin/config`, { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
        fetch(`${apiUrl}/admin/tickets`, { headers: { 'Authorization': `Bearer ${session.access_token}` } })
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch admin stats');
      if (!configRes.ok) throw new Error('Failed to fetch config');
      if (!ticketsRes.ok) console.error('Failed to fetch tickets'); // Don't crash if tickets fail

      const data = await statsRes.json();
      const configData = await configRes.json();
      let ticketsData = [];
      try { ticketsData = await ticketsRes.json(); } catch(e) {}
      
      setStats(data.stats);
      setStudents(data.students);
      setConfig(configData);
      setOriginalConfig(configData);
      setTickets(ticketsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setLoadingDetails(true);
    setStudentDetails(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
      
      const res = await fetch(`${apiUrl}/admin/student/${studentId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch student details');
      
      const data = await res.json();
      setStudentDetails(data);
    } catch (err) {
      toast.error('Failed to load details');
      setSelectedStudentId(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
      
      const res = await fetch(`${apiUrl}/admin/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error('Failed to save configuration');
      toast.success('Configuration saved successfully');
      setOriginalConfig(config);
    } catch (err) {
      toast.error('Failed to save config');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleLandingChange = (key: string, value: any) => {
    setConfig((prev: any) => ({
      ...prev,
      landing_page: {
        ...(prev?.landing_page || {}),
        [key]: value
      }
    }));
  };

  const handleRestoreDefaults = () => {
    setConfig((prev: any) => ({
      ...prev,
      landing_page: {
        ...(prev?.landing_page || {}),
        ...DEFAULT_LANDING_CONFIG
      }
    }));
  };

  const handleAddCard = () => {
    const currentCards = config?.landing_page?.capabilities_cards || [];
    handleLandingChange('capabilities_cards', [...currentCards, { eyebrow: 'NEW CARD', title: 'title.', desc: 'description.' }]);
  };

  const handleUpdateCard = (idx: number, key: string, value: string) => {
    const currentCards = [...(config?.landing_page?.capabilities_cards || [])];
    currentCards[idx] = { ...currentCards[idx], [key]: value };
    handleLandingChange('capabilities_cards', currentCards);
  };

  const handleDeleteCard = (idx: number) => {
    const currentCards = [...(config?.landing_page?.capabilities_cards || [])];
    currentCards.splice(idx, 1);
    handleLandingChange('capabilities_cards', currentCards);
  };

  const handleDeleteStudent = async (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this student and all their roadmaps?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
      const res = await fetch(`${apiUrl}/admin/student/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) throw new Error('delete failed');
      
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (selectedStudentId === studentId) setSelectedStudentId(null);
      toast.success('Student deleted successfully');
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
      
      const res = await fetch(`${apiUrl}/admin/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update ticket status');
      
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      toast.success('Ticket status updated');
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const downloadCSV = () => {
    if (students.length === 0) return toast.error('No students to export');
    
    const headers = ['Name', 'Email', 'Branch', 'Primary Career', 'Joined Date'];
    const rows = students.map(s => [
      s.name || 'Unknown', 
      s.email, 
      s.branch || 'Unknown', 
      s.primary_career, 
      new Date(s.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pathforge_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleShowKey = (key: string) => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  const maskValue = (val: string) => {
    if (!val || val.length <= 4) return '••••••••';
    return val.slice(0, 4) + '•'.repeat(Math.min(Math.max(val.length - 4, 0), 20));
  };

  if (loading) {
    return (
      <div className="loading-state" style={{ fontFamily: 'var(--font-label)', letterSpacing: '0.1em' }}>
        <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>{`>`}_</motion.span> BOOTING ADMIN ENVIRONMENT...
      </div>
    );
  }

  return (
    <div className="lumen-workbench">
      <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
        <Menu size={20} />
      </button>
      <aside className={`lumen-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button 
          className="mobile-close-btn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="lumen-sidebar__brand" onClick={() => navigate('/dashboard')}>
          <Shield size={18} />
          <span className="wordmark">system admin</span>
        </div>
        
        <nav className="lumen-sidebar__nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><BarChart2 size={16} /> <span>analytics</span></button>
          <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}><Users size={16} /> <span>users</span></button>
          <button className={`nav-item ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}><Hexagon size={16} /> <span>support tickets</span></button>
          <button className={`nav-item ${activeTab === 'landing' ? 'active' : ''}`} onClick={() => setActiveTab('landing')}><Target size={16} /> <span>landing page cms</span></button>
          <button className={`nav-item ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}><Settings size={16} /> <span>ai config</span></button>
          <button className={`nav-item ${activeTab === 'credentials' ? 'active' : ''}`} onClick={() => setActiveTab('credentials')}><Key size={16} /> <span>credentials</span></button>
        </nav>

        <div className="lumen-sidebar__footer">
          <button className="nav-item" onClick={() => navigate('/dashboard')}>
            <Compass size={16} /> <span>back to console</span>
          </button>
          <button className="nav-item destructive" onClick={handleLogout}>
            <LogOut size={16} /> <span>disconnect</span>
          </button>
        </div>
      </aside>

      <main className="lumen-main">
        <header className="lumen-header">
          <div>
            <span className="eyebrow">00 · SYS ADMIN</span>
            <h1 className="lumen-title">system <em>administration</em>.</h1>
          </div>
        </header>

        {error && (
          <div className="alert-error" style={{ marginBottom: '2rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Analytics / Overview Tab */}
          {activeTab === 'overview' && stats && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              
              {/* Top KPI Cards */}
              <section className="lumen-stats">
                <div className="stat-cell">
                  <span className="stat__value">{stats.total_students}</span>
                  <span className="stat__label">TOTAL · STUDENTS</span>
                </div>
                <div className="stat-cell">
                  <span className="stat__value text-primary">{stats.total_roadmaps}</span>
                  <span className="stat__label">TOTAL · ROADMAPS</span>
                </div>
                <div className="stat-cell">
                  <span className="stat__value text-accent" style={{ fontSize: '1.25rem' }}>{stats.most_common_branch || 'n/a'}</span>
                  <span className="stat__label">TOP · BRANCH</span>
                </div>
                <div className="stat-cell">
                  <span className="stat__value" style={{ fontSize: '1.25rem' }}>{stats.most_common_career || 'n/a'}</span>
                  <span className="stat__label">TOP · CAREER</span>
                </div>
              </section>

              <section className="lumen-data" style={{ marginTop: '2rem' }}>
                <div className="data-header">
                  <span className="eyebrow">01 · ONBOARDING FUNNEL</span>
                </div>
                <div className="data-table-wrap" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-rule)' }}>signed up</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem' }}>{stats.funnel.signed_up}</span>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--color-rule)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-rule)' }}>started quiz</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem' }}>{stats.funnel.took_quiz}</span>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--color-rule)' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--color-accent)' }}>generated roadmap</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--color-accent)' }}>{stats.funnel.generated_roadmap}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Mentor Funnel */}
              <section className="lumen-data" style={{ marginTop: '2rem' }}>
                <div className="data-header">
                  <span className="eyebrow">02 · MENTOR FUNNEL</span>
                </div>
                <div className="data-table-wrap" style={{ padding: '2rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span className="eyebrow">roadmap views</span><span style={{ fontFamily:'var(--font-mono)' }}>{(stats as any).events?.roadmap_views ?? 0}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span className="eyebrow">mentor messages</span><span style={{ fontFamily:'var(--font-mono)' }}>{(stats as any).events?.mentor_messages ?? 0}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span className="eyebrow">unique mentor users</span><span style={{ fontFamily:'var(--font-mono)' }}>{(stats as any).events?.unique_mentor_users ?? 0}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span className="eyebrow">avg per user</span><span style={{ fontFamily:'var(--font-mono)', color:'var(--color-accent)' }}>{(stats as any).events?.avg_mentor_per_user ?? 0}</span></div>
                </div>
              </section>

              {/* Word Cloud */}
              <section className="lumen-data" style={{ marginTop: '2rem' }}>
                <div className="data-header">
                  <span className="eyebrow">03 · KEYWORD CLOUD</span>
                </div>
                <div className="data-table-wrap" style={{ padding: '3rem 2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                    {stats.word_cloud.length > 0 ? stats.word_cloud.map((w, idx) => {
                      const minCount = Math.min(...stats.word_cloud.map(x => x.value));
                      const maxCount = Math.max(...stats.word_cloud.map(x => x.value));
                      const normalizedSize = maxCount === minCount ? 1 : (w.value - minCount) / (maxCount - minCount);
                      const fontSize = 0.8 + (normalizedSize * 1.5) + 'rem';
                      const opacity = 0.4 + (normalizedSize * 0.6);
                      return (
                        <span key={idx} style={{ fontSize, opacity, fontFamily: 'var(--font-mono)', color: `var(--color-accent)`, padding: '0 8px' }}>
                          {w.text.toLowerCase()}
                        </span>
                      );
                    }) : (
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>no data.</span>
                    )}
                </div>
              </section>
            </motion.div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lumen-data">
              <div className="data-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="eyebrow">01 · USER REGISTRY ({students.length})</span>
                <button className="btn btn--outline" onClick={downloadCSV} style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>
                  download csv
                </button>
              </div>
              <div className="data-table-wrap">
                <table className="lumen-table">
                  <thead>
                    <tr>
                      <th>IDENTITY</th>
                      <th>EMAIL</th>
                      <th>BRANCH</th>
                      <th>CAREER</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="lumen-row" onClick={() => handleViewStudent(s.id)}>
                        <td>
                          <div className="career-cell">
                            <Hexagon size={14} className="accent-icon" />
                            <span>{s.name?.toLowerCase() || 'unknown'}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--color-rule)' }}>{s.email}</td>
                        <td style={{ color: 'var(--color-rule)' }}>{s.branch?.toLowerCase() || '—'}</td>
                        <td>
                          {s.primary_career && s.primary_career !== 'Not generated'
                            ? <span style={{ color: 'var(--color-accent)' }}>{s.primary_career.toLowerCase()}</span>
                            : <span style={{ color: 'var(--color-rule)' }}>pending</span>
                          }
                        </td>
                        <td className="text-right">
                          <div className="action-cell">
                            <button className="btn-icon hover-destructive" onClick={(e) => handleDeleteStudent(s.id, e)} title="delete student">
                              <Trash2 size={16} />
                            </button>
                            <Search size={16} style={{ color: 'var(--color-rule)' }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-rule)', fontFamily: 'var(--font-mono)' }}>no records.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Config / AI Tab */}
          {activeTab === 'config' && config && (
            <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span className="eyebrow">01 · PROMPT TUNING & SYSTEM LIMITS</span>
                <button className="btn btn--primary" onClick={saveConfig} disabled={savingConfig}>
                  {savingConfig ? 'saving...' : 'save config'}
                </button>
              </div>

              <section className="lumen-data" style={{ marginBottom: '2rem' }}>
                <div className="data-header">
                  <span className="eyebrow">GLOBAL SETTINGS</span>
                </div>
                <div className="data-table-wrap" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="eyebrow">CHAT CHARACTER / TOKEN LIMIT</label>
                    <input 
                      type="number"
                      className="lumen-input"
                      style={{ width: '200px', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config.chat_character_limit || 500}
                      onChange={e => setConfig({ ...config, chat_character_limit: e.target.value })}
                      min="50"
                      max="4000"
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-rule-2)', fontFamily: 'var(--font-label)' }}>MAXIMUM LENGTH FOR AI MENTOR RESPONSES (DEFAULT: 500)</p>
                  </div>
                </div>
              </section>

              <section className="lumen-data" style={{ marginBottom: '2rem' }}>
                <div className="data-header">
                  <span className="eyebrow">ROADMAP GENERATION SYSTEM PROMPT</span>
                </div>
                <div className="data-table-wrap" style={{ padding: '1rem' }}>
                  <textarea 
                    style={{ width: '100%', minHeight: '300px', padding: '1rem', background: 'transparent', border: 'none', color: 'var(--color-paper-contrast)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', resize: 'vertical', outline: 'none' }}
                    value={config.systemPrompt_roadmap}
                    onChange={e => setConfig({ ...config, systemPrompt_roadmap: e.target.value })}
                  />
                </div>
              </section>

              <section className="lumen-data">
                <div className="data-header">
                  <span className="eyebrow">AI MENTOR CHAT SYSTEM PROMPT</span>
                </div>
                <div className="data-table-wrap" style={{ padding: '1rem' }}>
                  <textarea 
                    style={{ width: '100%', minHeight: '200px', padding: '1rem', background: 'transparent', border: 'none', color: 'var(--color-paper-contrast)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', resize: 'vertical', outline: 'none' }}
                    value={config.systemPrompt_chat}
                    onChange={e => setConfig({ ...config, systemPrompt_chat: e.target.value })}
                  />
                </div>
              </section>
            </motion.div>
          )}

          {/* Credentials Tab */}
          {activeTab === 'credentials' && (
            <motion.div key="credentials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lumen-data">
              <div className="data-header">
                <span className="eyebrow">01 · SECRETS & ENV</span>
              </div>
              <div className="data-table-wrap">
                <table className="lumen-table">
                  <thead>
                    <tr>
                      <th>VARIABLE</th>
                      <th>VALUE</th>
                      <th className="text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credentials.map(cred => (
                      <tr key={cred.key} className="lumen-row">
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{cred.key}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>
                          {showKeys[cred.key] ? cred.value : maskValue(cred.value)}
                        </td>
                        <td className="text-right">
                          <div className="action-cell">
                            <button className="btn-icon" onClick={() => toggleShowKey(cred.key)}>
                              {showKeys[cred.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button className="btn-icon" onClick={() => { navigator.clipboard.writeText(cred.value); toast.success('copied!'); }}>
                              <Search size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Support Tickets Tab - grouped per user */}
          {activeTab === 'tickets' && (()=> {
            const grouped: Record<string, any[]> = {};
            tickets.forEach((t:any)=> { const k = t.email || 'unknown'; (grouped[k] = grouped[k]||[]).push(t); });
            const entries = Object.entries(grouped);
            return (
            <motion.div key="tickets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lumen-data">
              <div className="data-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span className="eyebrow">01 · SUPPORT TICKETS — {tickets.length} total, {entries.length} users</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem', padding:'1rem' }}>
                {entries.length>0 ? entries.map(([email, list]: any)=> (
                  <details key={email} open style={{ border:'1px solid var(--color-rule)', borderRadius:8, background:'var(--color-paper-2)', overflow:'hidden' }}>
                    <summary style={{ cursor:'pointer', padding:'0.85rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'center', listStyle:'none', flexWrap:'wrap', gap:'0.5rem' }}>
                      <span style={{ display:'flex', flexDirection:'column' }}>
                        <span style={{ fontFamily:'var(--font-mono)', color:'var(--color-ink)' }}>{list[0].name} — {email}</span>
                        <span className="eyebrow" style={{ opacity:0.6 }}>{list.length} ticket{list.length>1?'s':''}</span>
                      </span>
                      <span className="eyebrow" style={{ background:'var(--color-accent)', color:'#000', padding:'0.15rem 0.5rem', borderRadius:99 }}>{list.filter((x:any)=> x.status!=='resolved').length} open</span>
                    </summary>
                    <div style={{ borderTop:'1px solid var(--color-rule)', padding:'0.5rem' }}>
                      {list.map((ticket:any)=> (
                        <div key={ticket.id} onClick={()=> alert(`Problem:\n${ticket.problem}`)} style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem', alignItems:'center', justifyContent:'space-between', padding:'0.65rem 0.75rem', borderBottom:'1px solid var(--color-rule)', cursor:'pointer' }}>
                          <div style={{ flex:'1 1 200px' }}>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', color:'var(--color-ink)' }}>[{ticket.topic}] — {ticket.problem.substring(0,70)}{ticket.problem.length>70?'…':''}</span>
                            <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.7rem', color:'var(--color-rule)', marginLeft:'0.5rem' }}>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                          <select 
                            value={ticket.status} 
                            onClick={(e)=> e.stopPropagation()}
                            onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                            style={{ backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)', border: '1px solid var(--color-rule-2)', padding: '0.25rem', fontFamily: 'var(--font-mono)', fontSize:'0.8rem' }}
                          >
                            <option value="open">open</option>
                            <option value="in_progress">in_progress</option>
                            <option value="resolved">resolved</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </details>
                )) : (
                  <div style={{ textAlign: 'center', padding: '2rem', fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>no support tickets found.</div>
                )}
              </div>
            </motion.div>
            ); })()}

          {/* Landing CMS Tab */}
          {activeTab === 'landing' && (
            <motion.div key="landing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="lumen-data" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Left Column: Form */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="data-header">
                  <span className="eyebrow">01 · LANDING PAGE CONTENT</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn--outline" onClick={() => setConfig(originalConfig)}>DISCARD CHANGES</button>
                    <button className="btn btn--outline" onClick={handleRestoreDefaults}>RESTORE DEFAULTS</button>
                    <button className="btn btn--primary" onClick={saveConfig} disabled={savingConfig}>
                      <Save size={16} style={{ marginRight: '0.5rem' }} /> {savingConfig ? 'COMMITTING...' : 'COMMIT'}
                    </button>
                  </div>
                </div>
                <div style={{ padding: '2rem' }}>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="eyebrow">Hero Subtitle (Eyebrow)</label>
                    <input 
                      className="lumen-input"
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config?.landing_page?.hero_eyebrow || ''}
                      onChange={(e) => handleLandingChange('hero_eyebrow', e.target.value)}
                      placeholder="e.g. 01 · SYSTEM CALIBRATION"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="eyebrow">Hero Title Line 1</label>
                    <input 
                      className="lumen-input"
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config?.landing_page?.hero_title_1 || ''}
                      onChange={(e) => handleLandingChange('hero_title_1', e.target.value)}
                      placeholder="e.g. engineering the"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="eyebrow">Hero Title Line 2 (Emphasized)</label>
                    <input 
                      className="lumen-input"
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config?.landing_page?.hero_title_2 || ''}
                      onChange={(e) => handleLandingChange('hero_title_2', e.target.value)}
                      placeholder="e.g. unknown."
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="eyebrow">Hero CTA Label</label>
                    <input 
                      className="lumen-input"
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config?.landing_page?.hero_cta || ''}
                      onChange={(e) => handleLandingChange('hero_cta', e.target.value)}
                      placeholder="e.g. start for free"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                    <label className="eyebrow">Hero Lede</label>
                    <textarea 
                      className="lumen-input"
                      style={{ width: '100%', minHeight: '80px', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config?.landing_page?.hero_lede || ''}
                      onChange={(e) => handleLandingChange('hero_lede', e.target.value)}
                      placeholder="e.g. answer six questions..."
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="eyebrow">Footer Statement</label>
                    <input 
                      className="lumen-input"
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config?.landing_page?.footer_statement || ''}
                      onChange={(e) => handleLandingChange('footer_statement', e.target.value)}
                      placeholder="e.g. the instrument is dark..."
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="eyebrow">SEO Title / Desc (optional)</label>
                    <input 
                      className="lumen-input"
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)', marginBottom:'0.5rem' }}
                      value={config?.landing_page?.seo_title || ''}
                      onChange={(e) => handleLandingChange('seo_title', e.target.value)}
                      placeholder="SEO title"
                    />
                    <input 
                      className="lumen-input"
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }}
                      value={config?.landing_page?.seo_desc || ''}
                      onChange={(e) => handleLandingChange('seo_desc', e.target.value)}
                      placeholder="SEO description"
                    />
                  </div>

                  <hr className="rule-thick" style={{ margin: '2rem 0' }} />
                  <span className="eyebrow" style={{ display: 'block', marginBottom: '1rem' }}>STATS SECTION</span>
                  {[1, 2, 3].map(i => (
                    <div key={`stat_${i}`} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label className="eyebrow">Value {i}</label>
                        <input className="lumen-input" style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }} value={config?.landing_page?.[`stat_${i}_val`] || ''} onChange={(e) => handleLandingChange(`stat_${i}_val`, e.target.value)} />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label className="eyebrow">Label {i}</label>
                        <input className="lumen-input" style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }} value={config?.landing_page?.[`stat_${i}_lbl`] || ''} onChange={(e) => handleLandingChange(`stat_${i}_lbl`, e.target.value)} />
                      </div>
                    </div>
                  ))}

                  <hr className="rule-thick" style={{ margin: '2rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span className="eyebrow">CAPABILITIES CARDS</span>
                    <button className="btn btn--outline" onClick={handleAddCard} style={{ padding: '0 0.75rem', height: '2rem' }}>+ ADD CARD</button>
                  </div>
                  {(config?.landing_page?.capabilities_cards || []).map((card: any, idx: number) => (
                    <div key={idx} style={{ padding: '1rem', border: '1px solid var(--color-rule)', borderRadius: '8px', marginBottom: '1rem', background: 'var(--color-paper-2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span className="eyebrow">CARD {idx + 1}</span>
                        <button className="btn-icon hover-destructive" onClick={() => handleDeleteCard(idx)}><Trash2 size={16} /></button>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <input className="lumen-input" style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }} value={card.eyebrow} onChange={(e) => handleUpdateCard(idx, 'eyebrow', e.target.value)} placeholder="Eyebrow (e.g. PRECISION)" />
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <input className="lumen-input" style={{ width: '100%', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }} value={card.title} onChange={(e) => handleUpdateCard(idx, 'title', e.target.value)} placeholder="Title" />
                      </div>
                      <div className="form-group">
                        <textarea className="lumen-input" style={{ width: '100%', minHeight: '60px', background: 'transparent', border: '1px solid var(--color-rule)', color: 'var(--color-paper-contrast)', padding: '0.5rem', fontFamily: 'var(--font-mono)' }} value={card.desc} onChange={(e) => handleUpdateCard(idx, 'desc', e.target.value)} placeholder="Description" />
                      </div>
                    </div>
                  ))}

                </div>
              </div>

              {/* Right Column: Live Preview */}
              <div style={{ overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#000', position: 'relative', aspectRatio: '16/10' }}>
                <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%', pointerEvents: 'none' }}>
                  <Landing overrideConfig={config?.landing_page} />
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Student Details Sidebar/Modal inside Workbench */}
      <AnimatePresence>
        {selectedStudentId && (
          <div className="modal-overlay" onClick={() => setSelectedStudentId(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100 }}>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              style={{ 
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '600px', 
                backgroundColor: 'var(--color-paper-2)', borderLeft: '1px solid var(--color-rule-2)', 
                padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap:'wrap', gap:'0.75rem' }}>
                <span className="eyebrow">USER DOSSIER</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap:'wrap' }}>
                  {studentDetails && (
                    <button
                      className={`btn ${studentDetails.profile.is_blocked ? 'btn--outline' : 'btn--primary'}`}
                      onClick={async (e)=>{
                        e.stopPropagation();
                        const next = !studentDetails.profile.is_blocked;
                        if (!confirm(next ? 'Block this user?' : 'Unblock this user?')) return;
                        try{
                          const { data:{session} } = await supabase.auth.getSession();
                          const apiUrl = import.meta.env.VITE_API_BASE_URL || '/api';
                          const res = await fetch(`${apiUrl}/admin/block/${studentDetails.profile.id}`, { method:'POST', headers:{ 'Authorization':`Bearer ${session?.access_token}`, 'Content-Type':'application/json' }, body: JSON.stringify({ blocked: next }) });
                          if(!res.ok) throw new Error('block failed');
                          toast.success(next ? 'user blocked' : 'user unblocked');
                          setStudentDetails((p:any)=> ({...p, profile:{...p.profile, is_blocked: next}}));
                          setStudents(prev=> prev.map(s=> s.id===studentDetails.profile.id ? {...s, is_blocked: next} as any : s));
                        }catch{ toast.error('block toggle failed'); }
                      }}
                      style={{ fontSize:'0.75rem', padding:'0.4rem 0.75rem', height:'auto' }}
                      data-testid="block-toggle"
                    >
                      {studentDetails.profile.is_blocked ? 'unblock' : 'block'}
                    </button>
                  )}
                  <button className="btn-icon" onClick={() => setSelectedStudentId(null)} title="close">
                    <X size={20} /> 
                  </button>
                </div>
              </div>
              
              {loadingDetails ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Terminal className="spin" size={24} style={{ marginRight: '8px' }}/> compiling dossier...
                </div>
              ) : studentDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  {/* Profile Header */}
                  <div>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--color-paper-contrast)', marginBottom: '0.5rem' }}>
                      {studentDetails.profile.name?.toLowerCase() || 'anonymous'}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)', marginBottom: '1rem' }}>{studentDetails.profile.email}</p>
                    {studentDetails.profile.is_blocked && <span style={{ display:'inline-block', background:'var(--color-accent-2)', color:'#fff', padding:'0.2rem 0.5rem', borderRadius:4, fontFamily:'var(--font-mono)', fontSize:'0.7rem', marginBottom:'1rem' }}>BLOCKED</span>}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      <span style={{ border: '1px solid var(--color-rule)', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>ROLE: {studentDetails.profile.role}</span>
                      <span style={{ border: '1px solid var(--color-rule)', padding: '0.25rem 0.75rem', borderRadius: '4px' }}>BRANCH: {studentDetails.profile.branch || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Generated Roadmaps */}
                  <div className="lumen-data">
                    <div className="data-header">
                      <span className="eyebrow">01 · DEPLOYMENTS</span>
                    </div>
                    {studentDetails.roadmaps.length > 0 ? (
                      <div className="data-table-wrap">
                        <table className="lumen-table">
                          <tbody>
                            {studentDetails.roadmaps.map((rm, idx) => (
                              <tr key={idx} className="lumen-row" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '1.5rem' }}>
                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Hexagon size={16} className="accent-icon" />
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{rm.primary_career.toLowerCase()}</span>
                                  </div>
                                  <button className="btn btn--outline" onClick={() => window.open(`/roadmap?id=${rm.id}`, '_blank')}>VIEW</button>
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>
                                  {rm.roadmap_data?.reasoning || 'n/a'}
                                </div>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ padding: '2rem', fontFamily: 'var(--font-mono)', color: 'var(--color-rule)' }}>no roadmaps deployed.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'red', fontFamily: 'var(--font-mono)' }}>error fetching data.</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
