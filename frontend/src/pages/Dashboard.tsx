import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { Map, LogOut, FileText, ChevronRight, Compass, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [userName, setUserName] = useState('Student');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalChecked: 0, level: 'Beginner' });

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
        
        setStats({ totalChecked, level });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="container nav-content">
          <div className="nav-brand">
            <Map className="icon" size={24} />
            <span>Career Roadmap</span>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ margin: 0 }}>Welcome back, {userName}</h1>
            <div className="badge" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))' }}>
              <Award size={14} /> Level: {stats.level}
            </div>
          </div>
          <p>Your personalized command center for career growth. You have completed {stats.totalChecked} tasks!</p>
        </motion.div>

        <div className="dashboard-grid">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="card action-card">
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Ready for your next step?</h3>
                <p className="text-muted">Take the assessment to generate a new highly-tailored career roadmap based on your current constraints and goals.</p>
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/quiz')} style={{ width: '100%' }}>
                Start Assessment
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="card history-card">
              <h3 className="history-header">
                <FileText size={20} />
                Your Roadmaps
              </h3>
              
              {history.length > 0 ? (
                <div className="history-list">
                  {history.map((item, index) => (
                    <motion.div 
                      key={item.id} 
                      className="history-item" 
                      onClick={() => navigate(`/results?id=${item.id}`)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="history-item-info">
                        <h4>{item.primary_career || 'Generated Roadmap'}</h4>
                        <span className="history-item-date">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>
                          {getProgress(item.roadmap)}% Complete
                        </div>
                        <ChevronRight size={20} className="text-muted" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Compass size={48} className="empty-state-icon" />
                  <h3>No roadmaps yet</h3>
                  <p>You haven't generated any career roadmaps. Take the assessment to get started!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
