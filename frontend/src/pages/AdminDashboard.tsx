import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Users, BookOpen, Target, LogOut, Shield, Key, Trash2, Eye, EyeOff, Terminal, Compass, Settings, Save, AlertCircle, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import './Dashboard.css';

interface Stats {
  total_students: number;
  most_common_branch: string;
  most_common_career: string;
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
    { label: 'Supabase URL', key: 'SUPABASE_URL', value: import.meta.env.VITE_SUPABASE_URL || 'Not set' },
    { label: 'Supabase Anon Key', key: 'VITE_SUPABASE_ANON_KEY', value: import.meta.env.VITE_SUPABASE_ANON_KEY || 'Not set' },
    { label: 'API Base URL', key: 'VITE_API_BASE_URL', value: import.meta.env.VITE_API_BASE_URL || 'Not set' },
  ];

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
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
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const toggleShowKey = (key: string) => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  const maskValue = (val: string) => val.slice(0, 8) + '•'.repeat(Math.min(val.length - 8, 20));

  if (loading) {
    return <div className="workbench-loading"><Terminal className="spin" size={24} /> Loading Admin Console...</div>;
  }

  return (
    <div className="workbench">
      <aside className="workbench-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
          <Shield className="brand-icon" size={24} />
          <span className="brand-text">Admin Panel</span>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('overview')}><Target size={18} /> <span>Overview</span></button>
          <button className={`nav-item ${activeTab === 'students' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('students')}><Users size={18} /> <span>Command Centre</span></button>
          <button className={`nav-item ${activeTab === 'config' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('config')}><Settings size={18} /> <span>AI & Config</span></button>
          <button className={`nav-item ${activeTab === 'credentials' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('credentials')}><Key size={18} /> <span>Credentials</span></button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item text-muted" onClick={() => navigate('/dashboard')}>
            <Compass size={18} /> <span>Back to Dashboard</span>
          </button>
          <ThemeToggle />
          <button className="nav-item text-muted logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> <span>Disconnect</span>
          </button>
        </div>
      </aside>

      <main className="workbench-main">
        <header className="workbench-header" style={{ marginBottom: '2rem' }}>
          <div>
            <h1 className="workbench-title">System Administration</h1>
            <p className="workbench-subtitle">Manage users, AI behavior, and system environment.</p>
          </div>
        </header>

        {error && (
          <div className="alert-error" style={{ marginBottom: '2rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && stats && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="workbench-stats">
              <div className="stat-card">
                <span className="stat-label">Total Students</span>
                <span className="stat-value text-accent"><Users size={24} style={{ display: 'inline', marginRight: '8px' }}/>{stats.total_students}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Top Branch</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{stats.most_common_branch || 'N/A'}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Top Career Output</span>
                <span className="stat-value" style={{ fontSize: '1.25rem' }}>{stats.most_common_career || 'N/A'}</span>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="workbench-data">
              <div className="data-header">
                <h2>Command Centre Registry ({students.length})</h2>
              </div>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Branch</th>
                      <th>Career</th>
                      <th>Joined</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} className="data-row" style={{ cursor: 'pointer' }} onClick={() => handleViewStudent(s.id)}>
                        <td className="font-medium">{s.name || '—'}</td>
                        <td className="text-muted">{s.email}</td>
                        <td className="text-muted">{s.branch || '—'}</td>
                        <td>
                          {s.primary_career && s.primary_career !== 'Not generated'
                            ? <span className="badge" style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>{s.primary_career}</span>
                            : <span className="text-muted" style={{ fontSize: '0.75rem' }}>Pending</span>
                          }
                        </td>
                        <td className="text-muted text-sm">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="text-right">
                          <button className="btn-icon text-primary" onClick={(e) => { e.stopPropagation(); handleViewStudent(s.id); }} title="View Details">
                            <Search size={16} />
                          </button>
                          <button className="btn-icon text-muted hover-destructive" onClick={(e) => handleDeleteStudent(s.id, e)} title="Delete Student" style={{ marginLeft: '0.5rem' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>No students found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && config && (
            <motion.div key="config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>AI Prompt Tuning & App Configuration</h2>
                  <p className="text-muted">Modify system prompts and quiz questions dynamically.</p>
                </div>
                <button className="btn btn-primary" onClick={saveConfig} disabled={savingConfig}>
                  <Save size={16} style={{ marginRight: '8px' }} /> {savingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>

              <div className="card" style={{ padding: '2rem', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Terminal size={16} className="text-primary" /> Roadmap Generation System Prompt
                </h3>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  This prompt instructs the LLM on how to generate the career roadmap JSON. Do not change the JSON schema requirements.
                </p>
                <textarea 
                  style={{ width: '100%', minHeight: '250px', padding: '1rem', background: 'hsl(var(--secondary)/0.3)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }}
                  value={config.systemPrompt_roadmap}
                  onChange={e => setConfig({ ...config, systemPrompt_roadmap: e.target.value })}
                />
              </div>

              <div className="card" style={{ padding: '2rem', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Terminal size={16} className="text-primary" /> AI Ask Chatbot System Prompt
                </h3>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Controls the behavior of the roadmap context-aware chatbot.
                </p>
                <textarea 
                  style={{ width: '100%', minHeight: '150px', padding: '1rem', background: 'hsl(var(--secondary)/0.3)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }}
                  value={config.systemPrompt_chat}
                  onChange={e => setConfig({ ...config, systemPrompt_chat: e.target.value })}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'credentials' && (
            <motion.div key="credentials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ padding: '2rem', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>System Credentials</h3>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Frontend environment variables currently loaded in this deployment.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {credentials.map(cred => (
                    <div key={cred.key} style={{ padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--secondary)/0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cred.label}</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-icon text-muted" onClick={() => toggleShowKey(cred.key)}>
                            {showKeys[cred.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(cred.value); toast.success('Copied!'); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                            Copy
                          </button>
                        </div>
                      </div>
                      <code style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-foreground))', wordBreak: 'break-all' }}>
                        {showKeys[cred.key] ? cred.value : maskValue(cred.value)}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudentId && (
          <div className="modal-overlay" onClick={() => setSelectedStudentId(null)}>
            <motion.div 
              className="modal-content"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={e => e.stopPropagation()}
              style={{ 
                position: 'fixed', right: 0, top: 0, bottom: 0, width: '100%', maxWidth: '600px', 
                backgroundColor: 'hsl(var(--background))', borderLeft: '1px solid hsl(var(--border))', 
                padding: '2rem', overflowY: 'auto', zIndex: 100,
                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
              }}
            >
              <button className="btn-icon" onClick={() => setSelectedStudentId(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                <X size={24} />
              </button>
              
              {loadingDetails ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-foreground))' }}>
                  <Terminal className="spin" size={24} style={{ marginRight: '8px' }}/> Loading Insights...
                </div>
              ) : studentDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '2rem' }}>
                  {/* Profile Header */}
                  <div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{studentDetails.profile.name || 'Anonymous User'}</h2>
                    <p className="text-muted" style={{ marginBottom: '1rem' }}>{studentDetails.profile.email}</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span className="badge" style={{ background: 'hsl(var(--primary)/0.1)', color: 'hsl(var(--primary))', padding: '4px 12px', borderRadius: '16px' }}>Role: {studentDetails.profile.role}</span>
                      <span className="badge" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--foreground))', padding: '4px 12px', borderRadius: '16px' }}>Branch: {studentDetails.profile.branch || 'None'}</span>
                      <span className="text-muted text-sm" style={{ alignSelf: 'center' }}>Joined: {new Date(studentDetails.profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <hr style={{ borderColor: 'hsl(var(--border))' }}/>

                  {/* Quiz Responses */}
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><BookOpen size={18} className="text-primary"/> Quiz Responses</h3>
                    {studentDetails.quizResponses.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {studentDetails.quizResponses.map((qr, idx) => (
                          <div key={idx} className="card" style={{ padding: '1.5rem', background: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
                            <div style={{ marginBottom: '1rem' }}>
                              <h4 style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}>Additional Context (Future Goal)</h4>
                              <p style={{ background: 'hsl(var(--secondary)/0.5)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                                {qr.free_text || 'No extra context provided.'}
                              </p>
                            </div>
                            <h4 style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.5rem' }}>Selected Answers</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {Object.entries(qr.answers || {}).map(([questionId, answer]) => (
                                <div key={questionId} style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>{questionId}</span>
                                  <span style={{ fontSize: '0.875rem' }}>{String(answer)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted" style={{ fontSize: '0.875rem' }}>This student hasn't completed the quiz yet.</p>
                    )}
                  </div>

                  <hr style={{ borderColor: 'hsl(var(--border))' }}/>

                  {/* Generated Roadmaps */}
                  <div>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}><Compass size={18} className="text-primary"/> Generated Roadmaps</h3>
                    {studentDetails.roadmaps.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {studentDetails.roadmaps.map((rm, idx) => (
                          <div key={idx} className="card" style={{ padding: '1.5rem', background: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
                            <h4 style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: 'hsl(var(--primary))' }}>{rm.primary_career}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', display: 'block', marginBottom: '1rem' }}>
                              Generated on {new Date(rm.created_at).toLocaleString()}
                            </span>
                            
                            <h5 style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>AI Reasoning</h5>
                            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
                              {rm.roadmap_data?.reasoning || 'N/A'}
                            </p>

                            <h5 style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Alternative Paths</h5>
                            <ul style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))', paddingLeft: '1.5rem', margin: 0 }}>
                              {rm.roadmap_data?.alternative_paths?.map((alt: string, i: number) => (
                                <li key={i}>{alt}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted" style={{ fontSize: '0.875rem' }}>No roadmaps generated yet.</p>
                    )}
                  </div>

                </div>
              ) : (
                <div className="alert-error">Failed to load student data.</div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
