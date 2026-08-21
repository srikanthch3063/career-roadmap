import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './Landing.css';

const STATS = [
  { label: 'ROADMAPS · GENERATED', value: '12,400' },
  { label: 'CAREER PATHS · COVERED', value: '85' },
  { label: 'AVG SATISFACTION', value: '4.9' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="lumen-page">
      {/* Nav N5 - Floating Pill */}
      <nav className="nav-n5">
        <div className="nav-n5__inner">
          <span className="wordmark">pathforge</span>
          <div className="nav-n5__links">
            <a href="#features">features</a>
            <a href="#pricing">pricing</a>
          </div>
          <button className="btn btn--outline" onClick={() => navigate('/auth')}>log in</button>
        </div>
      </nav>

      {/* Marquee Hero - Lumen style */}
      <section className="hero">
        <div className="hero__content">
          <div className="hero__left">
            <span className="eyebrow">00 · ROADMAP INFERENCE</span>
            <h1 className="hero__title">
              career paths,<br />
              <em>engineered</em> by ai.
            </h1>
            <p className="hero__lede">
              answer six questions. get a precise, opinionated career roadmap in under 30 seconds. no vague advice.
            </p>
            <button className="btn btn--primary" onClick={() => navigate('/auth')}>
              start for free
            </button>
          </div>
          
          <div className="hero__right">
            {/* Lumen Apparatus - Filament Chamber */}
            <figure className="apparatus apparatus--filament" aria-hidden="true">
              <div className="chamber">
                <span className="chamber__wall"></span>
                <span className="chamber__electrode" style={{'--y': '22%'} as any}></span>
                <span className="chamber__electrode" style={{'--y': '42%'} as any}></span>
                <span className="chamber__electrode" style={{'--y': '62%'} as any}></span>
                <span className="chamber__electrode" style={{'--y': '82%'} as any}></span>
                <span className="chamber__filament"></span>
                <span className="chamber__glow"></span>
                <span className="chamber__stencil">PF-04</span>
              </div>
              <ul className="callouts">
                <li className="callout" style={{'--side': 'left', '--y': '18%'} as any}><span>P50 · 28 MS</span></li>
                <li className="callout" style={{'--side': 'right', '--y': '36%'} as any}><span>COLD-START · 0.4 S</span></li>
                <li className="callout" style={{'--side': 'left', '--y': '62%'} as any}><span>PATH · DEVOPS</span></li>
                <li className="callout" style={{'--side': 'right', '--y': '80%'} as any}><span>MODEL · GPT-4</span></li>
              </ul>
            </figure>
          </div>
        </div>
      </section>

      {/* Meter Strip */}
      <aside className="meter" aria-label="Signal readout">
        <p className="meter__label meter__label--left">SIGNAL · 12.4 KHZ</p>
        <div className="meter__bars">
          {Array.from({ length: 64 }).map((_, i) => (
            <span key={i} style={{ height: `${20 + Math.sin(i * 0.2) * 8}px`, opacity: 0.2 + Math.random() * 0.8 }} />
          ))}
        </div>
        <p className="meter__label meter__label--right">DRIFT · 0.04 Σ</p>
      </aside>
      
      <hr className="rule-thick" />

      {/* Stats Section */}
      <section className="stats-row">
        <div className="stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="stat-cell">
              <span className="stat__value">{s.value}</span>
              <span className="stat__label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <hr className="rule-thick" />

      {/* Feature Stack / Bento hybrid */}
      <section id="features" className="section-padded">
        <div className="container">
          <span className="eyebrow" style={{marginBottom: '1rem', display: 'block'}}>01 · CAPABILITIES</span>
          <h2 className="section-title">a single primitive.<br/>scales to any career.</h2>
          
          <div className="card-grid">
            <div className="card card--glow">
              <span className="card__eyebrow">PRECISION</span>
              <h3>laser-focused goals.</h3>
              <p>exact frameworks, languages, and milestones. no vague advice.</p>
            </div>
            <div className="card card--glow">
              <span className="card__eyebrow">RESOURCES</span>
              <h3>curated materials.</h3>
              <p>project ideas and learning paths specific to your niche.</p>
            </div>
            <div className="card card--glow">
              <span className="card__eyebrow">INSIGHTS</span>
              <h3>market data.</h3>
              <p>see real salary data and growth trends for your target path.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Ft5 */}
      <footer className="footer-ft5">
        <div className="footer-ft5__inner">
          <div className="footer-ft5__statement">
            <p>the instrument is dark. the output is yours.</p>
            <span className="wordmark">pathforge © 2026</span>
          </div>
          <div className="footer-ft5__links">
            <a href="#">privacy</a>
            <a href="#">terms</a>
            <a href="#">system status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
