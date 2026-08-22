import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Users, BookOpen, Target, LogOut, Shield, Key, Trash2, Eye, EyeOff, Terminal, Compass, Settings, Save, Search, Download, BarChart2, Filter, Hexagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
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
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'config' | 'credentials'>('overview');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
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
      
      const [statsRes, configRes] = await Promise.all([
        fetch(`${apiUrl}/admin/stats`, { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
        fetch(`${apiUrl}/admin/config`, { headers: { 'Authorization': `Bearer ${session.access_token}` } })
      ]);

      if (!statsRes.ok) throw new Error('Failed to fetch admin stats');
      if (!configRes.ok) throw new Error('Failed to fetch config');

      const data = await statsRes.json();
      const configData = await configRes.json();
      
      setStats(data.stats);
      setStudents(data.students);
      setConfig(configData);
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
    } catch (err) {
      toast.error('Failed to save config');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this student and all their roadmaps?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('roadmaps').delete().eq('user_id', studentId);
      await supabase.from('profiles').delete().eq('id', studentId);
      
      setStudents(prev => prev.filter(s => s.id !== studentId));
      if (selectedStudentId === studentId) setSelectedStudentId(null);
      toast.success('Student deleted successfully');
    } catch {
      toast.error('Failed to delete student');
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
    return <div className="loading-state"><Terminal className="spin" size={24} /> booting admin environment...</div>;
  }

  return (
    <div className="lumen-workbench">
      <aside className="lumen-sidebar">
        <div className="lumen-sidebar__brand" onClick={() => navigate('/dashboard')}>
          <Shield size={18} />
          <span className="wordmark">system admin</span>
        </div>
        
        <nav className="lumen-sidebar__nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}><BarChart2 size={16} /> <span>analytics</span></button>
          <button className={`nav-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}><Users size={16} /> <span>users</span></button>
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

              {/* Word Cloud */}
              <section className="lumen-data" style={{ marginTop: '2rem' }}>
                <div className="data-header">
                  <span className="eyebrow">02 · KEYWORD CLOUD</span>
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
                <span className="eyebrow">01 · PROMPT TUNING</span>
                <button className="btn btn--primary" onClick={saveConfig} disabled={savingConfig}>
                  {savingConfig ? 'saving...' : 'save config'}
                </button>
              </div>

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
                backgroundColor: 'var(--color-paper)', borderLeft: '1px solid var(--color-rule)', 
                padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <span className="eyebrow">USER DOSSIER</span>
                <button className="btn-icon" onClick={() => setSelectedStudentId(null)}>
                  <Trash2 size={20} style={{ transform: 'rotate(45deg)' }} /> 
                </button>
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
                    <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)', marginBottom: '1.5rem' }}>{studentDetails.profile.email}</p>
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
                                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Hexagon size={16} className="accent-icon" />
                                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>{rm.primary_career.toLowerCase()}</span>
                                </div>
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-rule)', marginBottom: '1rem' }}>
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
