import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Users, BookOpen, Target, LogOut, Shield, Key, Trash2, Eye, EyeOff, Terminal, Compass, Settings, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import './Dashboard.css'; // Reuse Workbench CSS

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

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student and all their roadmaps?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.from('roadmaps').delete().eq('user_id', studentId);
      await supabase.from('profiles').delete().eq('id', studentId);
      
      setStudents(prev => prev.filter(s => s.id !== studentId));
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
      {/* Side Rail Navigation */}
      <aside className="workbench-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
          <Shield className="brand-icon" size={24} />
          <span className="brand-text">Admin Panel</span>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'overview' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('overview')}><Target size={18} /> <span>Overview</span></button>
          <button className={`nav-item ${activeTab === 'students' ? 'active' : 'text-muted'}`} onClick={() => setActiveTab('students')}><Users size={18} /> <span>Students</span></button>
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

      {/* Main Content */}
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
          {/* Overview Tab */}
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

          {/* Students Tab */}
          {activeTab === 'students' && (
            <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="workbench-data">
              <div className="data-header">
                <h2>Student Registry ({students.length})</h2>
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
                      <tr key={s.id} className="data-row">
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
                          <button className="btn-icon text-muted hover-destructive" onClick={() => handleDeleteStudent(s.id)} title="Delete Student">
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

          {/* Config / AI Tab */}
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

              <div className="card" style={{ padding: '2rem', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Compass size={16} className="text-primary" /> Quiz Configuration (JSON)
                </h3>
                <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                  Edit the questions shown to users during onboarding. Must remain valid JSON.
                </p>
                <textarea 
                  style={{ width: '100%', minHeight: '300px', padding: '1rem', background: 'hsl(var(--secondary)/0.3)', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--foreground))', fontFamily: 'monospace', fontSize: '0.875rem', resize: 'vertical' }}
                  value={JSON.stringify(config.quizQuestions, null, 2)}
                  onChange={e => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setConfig({ ...config, quizQuestions: parsed });
                    } catch (err) {
                      // Allow invalid state while typing, but don't save to state.
                      // A proper implementation would use a robust JSON editor.
                    }
                  }}
                  onBlur={e => {
                     try {
                        const parsed = JSON.parse(e.target.value);
                        setConfig({ ...config, quizQuestions: parsed });
                     } catch(err) {
                        toast.error("Invalid JSON format for Quiz Questions!");
                     }
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Credentials Tab */}
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

              <div className="card" style={{ padding: '2rem', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Backend Secrets</h3>
                <div style={{ padding: '1rem', borderRadius: 'var(--radius)', backgroundColor: 'hsl(var(--primary) / 0.1)', border: '1px solid hsl(var(--primary) / 0.2)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <AlertCircle className="text-primary" size={24} />
                  <p style={{ fontSize: '0.875rem', color: 'hsl(var(--primary))', margin: 0 }}>
                    Backend credentials (Groq API Key, Service Role Key, JWT Secret) are securely stored in Vercel environment variables and are not exposed to the frontend. Go to your Vercel Dashboard to manage them.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;
