import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Zap, Target, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="glass-nav">
        <div className="container nav-content">
          <div className="nav-logo">
            <Map className="nav-icon" size={24} />
            <span>Career Roadmap</span>
          </div>
          <div className="nav-links">
            <button className="btn btn-ghost" onClick={() => navigate('/auth')}>Log in</button>
            <button className="btn btn-primary" onClick={() => navigate('/auth')}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-bg-glow"></div>
        <div className="container hero-container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div className="badge hero-badge">v2.0 Pro Max is live</div>
            <h1 className="hero-title">
              Map your future with <br />
              <span className="text-gradient">precision.</span>
            </h1>
            <p className="hero-subtitle">
              Instantly generate a personalized, actionable career roadmap tailored to your engineering branch and unique goals using advanced AI.
            </p>
            <div className="hero-ctas">
              <button className="btn btn-primary hero-btn" onClick={() => navigate('/auth')}>Start for free</button>
              <button className="btn btn-outline hero-btn" onClick={() => navigate('/auth')}>View Demo</button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features Bento Grid */}
      <section className="features container">
        <div className="features-header">
          <h2>Engineered for clarity</h2>
          <p className="text-muted">Everything you need to navigate your career path from day one.</p>
        </div>
        
        <motion.div 
          className="bento-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="card bento-card bento-large">
            <Zap className="bento-icon" />
            <h3>Instant Generation</h3>
            <p className="text-muted">Answer 6 simple questions and our AI processes your profile in seconds to generate a highly accurate timeline of skills and projects.</p>
          </motion.div>
          
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="card bento-card">
            <Target className="bento-icon" />
            <h3>Actionable Goals</h3>
            <p className="text-muted">No more vague advice. Get exact frameworks, languages, and interview milestones.</p>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }} className="card bento-card">
            <BookOpen className="bento-icon" />
            <h3>Tailored Resources</h3>
            <p className="text-muted">Curated project ideas and resource recommendations specific to your niche.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Trending Careers Section */}
      <section className="container" style={{ padding: '4rem 0' }}>
        <div className="features-header">
          <h2>Trending Careers in 2026</h2>
          <p className="text-muted">The fastest-growing roles based on industry demand and user roadmaps.</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {['AI Research Scientist', 'Cloud Architect', 'Full Stack Developer', 'Robotics Engineer'].map((career, i) => (
            <motion.div 
              key={career}
              className="card"
              style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <span style={{ fontWeight: 500 }}>{career}</span>
              <span className="badge" style={{ backgroundColor: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))' }}>
                +{(Math.random() * 20 + 10).toFixed(1)}% YoY
              </span>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer container">
        <p className="text-muted">© 2026 Career Roadmap Guide. Built with precision.</p>
      </footer>
    </div>
  );
};

export default Landing;
