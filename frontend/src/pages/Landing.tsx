import { useNavigate } from 'react-router-dom';
import { Map, Zap, Target, BookOpen, ArrowRight, Star, TrendingUp, Users, Brain, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import './Landing.css';

const STATS = [
  { label: 'Roadmaps Generated', value: '12,400+' },
  { label: 'Career Paths Covered', value: '85+' },
  { label: 'Avg. Satisfaction', value: '4.9 / 5' },
];

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Precision',
    description: 'Our model analyzes your branch, goals, and constraints to generate a unique, opinionated roadmap — not a generic template.',
    color: 'hsl(var(--primary))',
    bg: 'hsl(var(--primary) / 0.08)',
    large: true,
  },
  {
    icon: Target,
    title: 'Laser-Focused Goals',
    description: 'Exact frameworks, languages, and milestones. No vague advice.',
    color: 'hsl(var(--success))',
    bg: 'hsl(var(--success) / 0.08)',
  },
  {
    icon: BookOpen,
    title: 'Curated Resources',
    description: 'Project ideas and learning paths specific to your niche.',
    color: 'hsl(var(--warning))',
    bg: 'hsl(var(--warning) / 0.08)',
  },
  {
    icon: TrendingUp,
    title: 'Salary Insights',
    description: 'See real market data for your target career path.',
    color: 'hsl(var(--info))',
    bg: 'hsl(var(--info) / 0.08)',
  },
  {
    icon: Zap,
    title: 'Instant Generation',
    description: '6 questions. 30 seconds. Your entire career plan.',
    color: 'hsl(var(--accent))',
    bg: 'hsl(var(--accent) / 0.08)',
  },
];

const TRENDING = [
  { career: 'AI Research Scientist', growth: '+34.2%', hot: true },
  { career: 'Cloud Architect', growth: '+28.7%', hot: true },
  { career: 'Full Stack Developer', growth: '+22.1%', hot: false },
  { career: 'Robotics Engineer', growth: '+19.5%', hot: false },
  { career: 'Cybersecurity Analyst', growth: '+31.0%', hot: true },
  { career: 'DevOps Engineer', growth: '+25.3%', hot: false },
];

const TESTIMONIALS = [
  { name: 'Priya K.', role: 'CSE Student → SDE at Zepto', text: 'Generated my roadmap in 30 seconds. Had a job offer 8 months later. This is the tool I wish I had in first year.' },
  { name: 'Arjun M.', role: 'ECE → ML Engineer', text: 'I was confused about switching streams. The roadmap was brutally honest and gave me a 12-week plan that actually worked.' },
  { name: 'Riya S.', role: 'IT → Product Manager', text: 'The salary data alone was worth it. Helped me negotiate a 40% higher offer.' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="glass-nav">
        <div className="container nav-content">
          <div className="nav-logo">
            <Map className="nav-icon" size={22} />
            <span>PathForge</span>
          </div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#trending" className="nav-link">Careers</a>
            <button className="btn btn-ghost" onClick={() => navigate('/auth')}>Log in</button>
            <button className="btn btn-primary" onClick={() => navigate('/auth')}>
              Get Started <ArrowRight size={16} style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-grid-overlay" />

        <motion.div
          className="container hero-container"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <motion.div
              className="hero-pill"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Star size={12} fill="currentColor" />
              <span>Trusted by 12,400+ engineering students</span>
            </motion.div>

            <h1 className="hero-title">
              Your career path,<br />
              <span className="hero-title-accent">engineered by AI.</span>
            </h1>

            <p className="hero-subtitle">
              Answer 6 questions about your branch, constraints, and goals.<br />
              Get a precise, opinionated career roadmap in under 30 seconds.
            </p>

            <div className="hero-ctas">
              <motion.button
                className="btn btn-primary hero-btn-primary"
                onClick={() => navigate('/auth')}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Start for free
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                className="btn hero-btn-ghost"
                onClick={() => navigate('/auth')}
                whileHover={{ scale: 1.02 }}
              >
                See how it works
              </motion.button>
            </div>

            {/* Stats Row */}
            <motion.div
              className="hero-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              {STATS.map((s, i) => (
                <div key={i} className="hero-stat">
                  <span className="hero-stat-value">{s.value}</span>
                  <span className="hero-stat-label">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-scroll-indicator"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronDown size={20} />
        </motion.div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">Why PathForge</span>
          <h2>Engineered for clarity,<br />built for results.</h2>
          <p className="text-muted">Everything you need to navigate your career path from day one.</p>
        </motion.div>

        <motion.div
          className="bento-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                className={`card bento-card ${f.large ? 'bento-large' : ''}`}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="bento-icon-wrap" style={{ backgroundColor: f.bg }}>
                  <Icon size={22} color={f.color} />
                </div>
                <h3>{f.title}</h3>
                <p className="text-muted">{f.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Trending Careers Section */}
      <section id="trending" className="trending-section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-eyebrow">Market Pulse</span>
            <h2>Trending careers in 2026</h2>
            <p className="text-muted">The fastest-growing roles based on industry demand and real hiring data.</p>
          </motion.div>

          <div className="trending-grid">
            {TRENDING.map((item, i) => (
              <motion.div
                key={item.career}
                className="trending-card card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -3 }}
              >
                <div className="trending-card-left">
                  {item.hot && <span className="hot-badge">🔥 Hot</span>}
                  <span className="trending-career-name">{item.career}</span>
                </div>
                <span className="trending-growth">{item.growth} YoY</span>
              </motion.div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/auth')}>
              Generate roadmap for any career <ArrowRight size={16} style={{ marginLeft: '6px' }} />
            </button>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="testimonials-section container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="section-eyebrow">Social Proof</span>
          <h2>Students who used it, got hired.</h2>
        </motion.div>

        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              className="card testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="testimonial-stars">{'★'.repeat(5)}</div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name[0]}</div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-orb" />
        <motion.div
          className="container cta-content"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Users size={40} color="hsl(var(--primary))" style={{ marginBottom: '1.5rem' }} />
          <h2>Ready to map your future?</h2>
          <p className="text-muted">Join thousands of students who stopped guessing and started building.</p>
          <motion.button
            className="btn btn-primary hero-btn-primary"
            onClick={() => navigate('/auth')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{ marginTop: '2rem' }}
          >
            Start for free — it takes 30 seconds
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="footer container">
        <div className="footer-brand">
          <Map size={18} color="hsl(var(--primary))" />
          <span>PathForge</span>
        </div>
        <p className="text-muted" style={{ fontSize: '0.8125rem' }}>© 2026 PathForge. Built with precision. No fluff.</p>
      </footer>
    </div>
  );
};

export default Landing;
