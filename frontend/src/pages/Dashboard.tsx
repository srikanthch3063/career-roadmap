import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Map, LogOut, FileText, ChevronRight, Compass, Award, Trash2, Plus, Terminal, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userName, setUserName] = useState('Student');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalChecked: 0, level: 'Beginner', totalRoadmaps: 0 });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Extract a friendly name
      const meta = user.user_metadata;
      const friendlyName = meta?.full_name || meta?.name || user.email?.split('@')[0] || 'Student';
      setUserName(friendlyName);

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // Fetch History
      const { data: historyData } = await supabase
        .from('roadmaps')
        .select('id, created_at, primary_career, roadmap')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyData) {
        setHistory(historyData);
        // Calculate global stats
        let totalChecked = 0;
        historyData.forEach(item => {
          if (item.roadmap?.checked_items) {
            totalChecked += item.roadmap.checked_items.length;
          }
        });
        let level = 'Beginner';
        if (totalChecked > 5) level = 'Explorer';
        if (totalChecked > 15) level = 'Specialist';
        if (totalChecked > 30) level = 'Expert';
        if (totalChecked > 50) level = 'Master';
        
        setStats({ totalChecked, level, totalRoadmaps: historyData.length });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (roadmapJson: any) => {
    if (!roadmapJson || !roadmapJson.roadmap) return 0;
    const r = roadmapJson.roadmap;
    const total = (r.skills_to_learn?.length || 0) + 
                  (r.technologies?.length || 0) + 
                  (r.project_ideas?.length || 0) + 
                  (r.certifications?.length || 0);
    const checked = roadmapJson.checked_items?.length || 0;
    if (total === 0) return 0;
    return Math.round((checked / total) * 100);
  };

  const deleteRoadmap = async (e: React.MouseEvent, roadmapId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this roadmap? This cannot be undone.')) return;
    const { error } = await supabase.from('roadmaps').delete().eq('id', roadmapId);
    if (error) {
      toast.error('Failed to delete roadmap');
    } else {
      setHistory(prev => prev.filter(r => r.id !== roadmapId));
      setStats(prev => ({ ...prev, totalRoadmaps: prev.totalRoadmaps - 1 }));
      toast.success('Roadmap deleted');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="workbench-loading"><Terminal className="spin" size={24} /> Loading Workspace...</div>;
  }

  return (
    <div className="workbench">
      {/* Side Rail Navigation */}
      <aside className="workbench-sidebar">
        <div className="sidebar-brand" onClick={() => navigate('/')}>
          <Map className="brand-icon" size={24} />
          <span className="brand-text">PathForge</span>
        </div>
        
        <nav className="sidebar-nav">
          <button className="nav-item active"><Compass size={18} /> <span>Command Center</span></button>
          <button className="nav-item text-muted" onClick={() => navigate('/quiz')}><Plus size={18} /> <span>New Roadmap</span></button>
          {profile?.role === 'admin' && (
            <button className="nav-item text-muted" onClick={() => navigate('/admin')}><Settings size={18} /> <span>Admin Console</span></button>
          )}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
          <button className="nav-item text-muted logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> <span>Disconnect</span>
          </button>
        </div>
      </aside>

      {/* Main Command Center */}
      <main className="workbench-main">
        <header className="workbench-header">
          <div>
            <h1 className="workbench-title">Welcome, {userName}</h1>
            <p className="workbench-subtitle">Your active career deployments and tracking metrics.</p>
          </div>
          <button className="btn btn-primary btn-generate" onClick={() => navigate('/quiz')}>
            <Plus size={16} /> Deploy New Roadmap
          </button>
        </header>

        {/* Dense Stats Row */}
        <section className="workbench-stats">
          <div className="stat-card">
            <span className="stat-label">Active Roadmaps</span>
            <span className="stat-value">{stats.totalRoadmaps}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tasks Completed</span>
            <span className="stat-value">{stats.totalChecked}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Current Rank</span>
            <span className="stat-value text-accent">
              <Award size={18} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }}/> 
              {stats.level}
            </span>
          </div>
        </section>

        {/* Data Grid for Roadmaps */}
        <section className="workbench-data">
          <div className="data-header">
            <h2>Deployment History</h2>
          </div>

          {history.length > 0 ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Career Path</th>
                    <th>Created</th>
                    <th>Progress</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item, index) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/results?id=${item.id}`)}
                      className="data-row"
                    >
                      <td className="font-medium text-primary">
                        <div className="career-cell">
                          <FileText size={16} className="text-muted" />
                          {item.primary_career || 'Generated Roadmap'}
                        </div>
                      </td>
                      <td className="text-muted text-sm">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${getProgress(item.roadmap)}%` }} />
                          </div>
                          <span className="progress-text">{getProgress(item.roadmap)}%</span>
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="action-cell">
                          <button 
                            className="btn-icon text-muted hover-destructive"
                            onClick={(e) => deleteRoadmap(e, item.id)}
                            title="Delete deployment"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight size={16} className="text-muted" />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="workbench-empty">
              <Terminal size={32} className="text-muted" />
              <h3>No active deployments</h3>
              <p className="text-muted">You haven't generated any career roadmaps yet.</p>
              <button className="btn btn-outline" onClick={() => navigate('/quiz')} style={{ marginTop: '1rem' }}>
                Run Assessment
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
