import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Users, BookOpen, Target, LogOut, Shield, Map } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
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
          <button className="btn btn-ghost" onClick={handleLogout}>
            <LogOut size={16} style={{ marginRight: '0.5rem' }} />
            Log Out
          </button>
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
          <p>Overview of all students and their career roadmaps.</p>
        </motion.div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '2rem' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {stats && (
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}
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

        <motion.div
          className="card"
          style={{ padding: '2rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Student List</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Name</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Email</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Branch</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Career</th>
                  <th style={{ padding: '0.75rem 0', fontWeight: 500, fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>Joined</th>
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
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                      No students registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
