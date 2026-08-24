import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Map, LogOut, FileText, ChevronRight, Compass, Trash2, Plus, Terminal, Settings, Hexagon, Menu, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ThemeToggle from '../components/ThemeToggle';
import HelpModal from '../components/HelpModal';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userName, setUserName] = useState('student');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalChecked: 0, level: 'init', totalRoadmaps: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const hasGreeted = useRef(false);

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

      const meta = user.user_metadata;
      const friendlyName = meta?.full_name || meta?.name || user.email?.split('@')[0] || 'student';
      setUserName(friendlyName.toLowerCase());

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      const { data: historyData } = await supabase
        .from('roadmaps')
        .select('id, created_at, primary_career, roadmap')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyData) {
        const visibleHistory = historyData.filter(item => !item.roadmap?.is_deleted);
        setHistory(visibleHistory);
        
        let totalChecked = 0;
        visibleHistory.forEach(item => {
          if (item.roadmap?.checked_items) {
            totalChecked += item.roadmap.checked_items.length;
          }
        });
        
        let level = 'init';
        if (totalChecked > 5) level = 'explorer';
        if (totalChecked > 15) level = 'specialist';
        if (totalChecked > 30) level = 'expert';
        if (totalChecked > 50) level = 'master';
        
        const newStats = {
          totalChecked: totalChecked,
          level: level,
          totalRoadmaps: visibleHistory.length
        };
        
        setStats(newStats);

        if (!hasGreeted.current) {
          toast.success(`welcome back, ${friendlyName.toLowerCase()}`);
          hasGreeted.current = true;
        }
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
    if (!confirm('confirm deletion?')) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000/api' : '/api');
      const response = await fetch(`${apiUrl}/roadmaps/${roadmapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      setHistory(prev => prev.filter(r => r.id !== roadmapId));
      setStats(prev => ({ ...prev, totalRoadmaps: prev.totalRoadmaps - 1 }));
      toast.success('deleted successfully');
    } catch (error) {
      toast.error('failed to delete');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="lumen-workbench">
        <div className="loading-state" style={{ height: '100dvh' }}>
          <div className="lumen-loader" /> initializing nexus...
        </div>
      </div>
    );
  }

  return (
    <div className="lumen-workbench">
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
      <aside className={`lumen-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <button 
          className="mobile-close-btn"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{display:'none'}}
          aria-label="Close Menu"
        >
          ✕
        </button>
        <div className="lumen-sidebar__brand" onClick={() => navigate('/')}>
          <img src="/pathforge-logo.png" alt="Pathforge Logo" style={{ width: 24, height: 24, borderRadius: 4 }} />
          <span className="wordmark">pathforge</span>
        </div>
        
        <nav className="lumen-sidebar__nav">
          <button className="nav-item active" onClick={() => setIsMobileMenuOpen(false)}>
            <Compass size={16} /> <span>console</span>
          </button>
          <button className="nav-item" onClick={() => { setIsMobileMenuOpen(false); navigate('/quiz'); }}>
            <Plus size={16} /> <span>generate</span>
          </button>
          {profile?.role === 'admin' && (
            <button className="nav-item" onClick={() => { setIsMobileMenuOpen(false); navigate('/admin'); }}>
              <Settings size={16} /> <span>system admin</span>
            </button>
          )}
        </nav>

        <div className="lumen-sidebar__footer">
          <ThemeToggle />
          <button className="nav-item" onClick={handleLogout} aria-label="Sign Out">
            <LogOut size={16} /> <span>sign out</span>
          </button>
          
          <div className="rule-thick" style={{ margin: '1rem 0' }}></div>
          
          <button className="nav-item" onClick={() => setIsHelpOpen(true)} aria-label="Help and Support">
            <HelpCircle size={16} /> <span>support</span>
          </button>
        </div>
      </aside>

      <main className="lumen-main">
        <header className="lumen-header">
          <div>
            <span className="eyebrow">00 · WORKSPACE</span>
            <h1 className="lumen-title">welcome, <em>{userName}</em>.</h1>
          </div>
          <button className="btn btn--primary" onClick={() => navigate('/quiz')}>
            <Plus size={16} style={{marginRight: 6}}/> new roadmap
          </button>
        </header>

        {/* Stats Row */}
        <section className="lumen-stats">
          <div className="stat-cell">
            <span className="stat__value">{stats.totalRoadmaps}</span>
            <span className="stat__label">ACTIVE · DEPLOYMENTS</span>
          </div>
          <div className="stat-cell">
            <span className="stat__value">{stats.totalChecked}</span>
            <span className="stat__label">TASKS · COMPLETED</span>
          </div>
          <div className="stat-cell">
            <span className="stat__value text-accent">
              {stats.level}
            </span>
            <span className="stat__label">CURRENT · RANK</span>
          </div>
        </section>

        <section className="lumen-data">
          <div className="data-header">
            <span className="eyebrow">01 · DEPLOYMENT HISTORY</span>
          </div>

          {history.length > 0 ? (
            <div className="data-table-wrap">
              <table className="lumen-table">
                <thead>
                  <tr>
                    <th>CAREER PATH</th>
                    <th>DEPLOYED</th>
                    <th>PROGRESS</th>
                    <th className="text-right">ACTIONS</th>
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
                      className="lumen-row"
                    >
                      <td>
                        <div className="career-cell">
                          <Hexagon size={14} className="accent-icon" />
                          <span>{item.primary_career?.toLowerCase() || 'generated roadmap'}</span>
                        </div>
                      </td>
                      <td className="text-muted">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        }).toLowerCase()}
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
                            className="btn-icon hover-destructive"
                            onClick={(e) => deleteRoadmap(e, item.id)}
                            title="delete"
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
            <div className="lumen-empty">
              <Terminal size={32} className="text-muted" />
              <h3>no deployments found.</h3>
              <p>initialize your first career roadmap.</p>
              <button className="btn btn--outline" onClick={() => navigate('/quiz')} style={{ marginTop: '1.5rem' }}>
                generate
              </button>
            </div>
          )}
        </section>
      </main>

      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        userEmail={profile?.email} 
        userName={userName} 
      />
    </div>
  );
};

export default Dashboard;
