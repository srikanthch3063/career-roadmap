import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Users, BookOpen, Target, LogOut, Shield, Key, Trash2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'credentials'>('overview');
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
      const res = await fetch(`${apiUrl}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch admin data');

      const data = await res.json();
      setStats(data.stats);
      setStudents(data.students);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student and all their roadmaps?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Delete roadmaps first, then profile
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

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const maskValue = (val: string) => val.slice(0, 8) + '•'.repeat(Math.min(val.length - 8, 20));

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="container nav-content">
          <div className="nav-brand">
            <Shield size={24} color="hsl(var(--primary))" />
            <span>Admin Panel</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <ThemeToggle />
            <button className="btn btn-ghost" onClick={handleLogout}>
              <LogOut size={16} style={{ marginRight: '0.5rem' }} />
              Log Out
            </button>
          </div>
        </div>
      </nav>

      <main className="container dashboard-main">
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1>Admin Dashboard</h1>
          <p>Manage students, roadmaps, and system credentials.</p>
        </motion.div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '0.5rem' }}>
          {[
            { id: 'overview' as const, label: 'Overview', icon: <Target size={16} /> },
            { id: 'students' as const, label: 'Students', icon: <Users size={16} /> },
            { id: 'credentials' as const, label: 'Credentials', icon: <Key size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '2rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'hsl(var(--info))' }}>
                <Users size={20} />
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Total Students</span>
              </div>
              <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{stats.total_students}</p>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'hsl(var(--success))' }}>
                <BookOpen size={20} />
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Top Branch</span>
              </div>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.most_common_branch || 'N/A'}</p>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'hsl(var(--warning))' }}>
                <Target size={20} />
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Top Career</span>
              </div>
              <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{stats.most_common_career || 'N/A'}</p>
            </motion.div>
          </motion.div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <motion.div
            className="card"
            style={{ padding: '2rem' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Student Management ({students.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Name</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Email</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Branch</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Career</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Joined</th>
                    <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>{s.name || '—'}</td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>{s.email}</td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem' }}>{s.branch || '—'}</td>
                      <td style={{ padding: '0.75rem 0' }}>
                        {s.primary_career && s.primary_career !== 'Not generated'
                          ? <span className="badge">{s.primary_career}</span>
                          : <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>Pending</span>
                        }
                      </td>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem 0' }}>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => handleDeleteStudent(s.id)}
                          style={{ color: 'hsl(var(--destructive))', padding: '0.25rem 0.5rem' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                        No students registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>System Credentials</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Frontend environment variables currently loaded in this deployment.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {credentials.map(cred => (
                  <div key={cred.key} style={{ padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--secondary))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{cred.label}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-ghost" onClick={() => toggleShowKey(cred.key)} style={{ padding: '0.25rem' }}>
                          {showKeys[cred.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(cred.value); toast.success('Copied!'); }} style={{ padding: '0.25rem', fontSize: '0.75rem' }}>
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

            <div className="card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Admin Info</h3>
              <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Backend credentials (Groq API Key, Service Role Key, JWT Secret) are securely stored in Vercel environment variables and are not exposed to the frontend.
              </p>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius)', backgroundColor: 'hsl(var(--primary) / 0.05)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
                <p style={{ fontSize: '0.875rem', color: 'hsl(var(--primary))' }}>
                  🔒 To update backend keys, go to your <strong>Vercel Dashboard → Settings → Environment Variables</strong>.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
