import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Terminal } from 'lucide-react';
import LegalModal from '../components/LegalModal';
import HelpModal from '../components/HelpModal';
import './Landing.css';

const STATS = [
  { value: '4.2', label: 'M APP REQUESTS' },
  { value: '1.2', label: 'T DATA POINTS' },
  { value: '99.9', label: '% UPTIME' },
];

function FeatureCard({ eyebrow, title, desc }: { eyebrow: string, title: string, desc: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div 
      ref={cardRef}
      className="card card--spotlight" 
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onTouchStart={handleMove}
    >
      <div className="card__spotlight-border" />
      <div className="card__spotlight-inner" />
      <div className="card__content">
        <span className="card__eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'status' | null>(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [landingConfig, setLandingConfig] = useState<any>(null);

  const openLegalModal = (e: React.MouseEvent, type: 'privacy' | 'terms' | 'status') => {
    e.preventDefault();
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  return (
    <div className="lumen-page">
      {/* Nav N5 - Floating Pill */}
      <nav className="nav-n5">
        <div className="nav-n5__inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0 }}>
            <img src="/pathforge-logo.png" alt="P" style={{ height: '1.15rem', width: 'auto', objectFit: 'contain', display: 'block', transform: 'translateY(1px)' }} />
            <span className="wordmark">athforge</span>
          </div>
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
            <span className="eyebrow">{landingConfig?.hero_eyebrow || '00 · ROADMAP INFERENCE'}</span>
            <h1 className="hero__title">
              {landingConfig?.hero_title_1 || 'career paths,'}<br />
              <em>{landingConfig?.hero_title_2 || 'engineered by ai.'}</em>
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
            <FeatureCard 
              eyebrow="PRECISION"
              title="laser-focused goals."
              desc="exact frameworks, languages, and milestones. no vague advice."
            />
            <FeatureCard 
              eyebrow="RESOURCES"
              title="curated materials."
              desc="project ideas and learning paths specific to your niche."
            />
            <FeatureCard 
              eyebrow="INSIGHTS"
              title="market data."
              desc="see real salary data and growth trends for your target path."
            />
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
            <a href="#" onClick={(e) => openLegalModal(e, 'privacy')}>privacy</a>
            <a href="#" onClick={(e) => openLegalModal(e, 'terms')}>terms</a>
            <a href="#" onClick={(e) => openLegalModal(e, 'status')}>system status</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setHelpModalOpen(true); }}>support</a>
          </div>
        </div>
      </footer>

      <LegalModal 
        isOpen={legalModalOpen} 
        onClose={() => setLegalModalOpen(false)} 
        type={legalModalType} 
      />

      <HelpModal 
        isOpen={helpModalOpen} 
        onClose={() => setHelpModalOpen(false)} 
      />
    </div>
  );
};

export default Landing;
