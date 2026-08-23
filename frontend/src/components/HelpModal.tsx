import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, userEmail = '', userName = '' }) => {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [topic, setTopic] = useState('');
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problem.length > 500) {
      toast.error('problem description must be under 500 characters.');
      return;
    }
    
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '');
      const response = await fetch(`${apiUrl}/api/support`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, topic, problem })
      });

      if (!response.ok) throw new Error('failed to submit ticket');
      
      toast.success('support ticket submitted. we will be in touch!');
      onClose();
      // Reset form
      setTopic('');
      setProblem('');
    } catch (err) {
      console.error(err);
      toast.error('failed to submit. please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="lumen-document" style={{ width: '100%', maxWidth: '500px', position: 'relative', margin: '1rem', background: 'var(--color-paper-2)' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'transparent', border: 'none', color: 'var(--color-ink-2)', cursor: 'pointer' }}
          aria-label="Close"
        >
          <X size={20} />
        </button>
        
        <h2 style={{ marginTop: 0, fontFamily: 'var(--font-serif)', fontSize: '1.5rem' }}>contact support</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>we're here to help. submit a ticket below.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>name</label>
            <input 
              className="input" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="your name"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>email</label>
            <input 
              className="input" 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="your email address"
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="eyebrow" style={{ display: 'block', marginBottom: '0.5rem' }}>topic</label>
            <select 
              className="input" 
              required 
              value={topic} 
              onChange={e => setTopic(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="" disabled>select a topic</option>
              <option value="account">account issues</option>
              <option value="billing">billing & payments</option>
              <option value="bug">report a bug</option>
              <option value="feedback">general feedback</option>
              <option value="other">other</option>
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="eyebrow" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>problem description</span>
              <span style={{ color: problem.length > 500 ? 'var(--color-accent-2)' : 'inherit' }}>{problem.length}/500</span>
            </label>
            <textarea 
              className="input" 
              required 
              rows={4}
              maxLength={500}
              value={problem} 
              onChange={e => setProblem(e.target.value)} 
              placeholder="describe your issue in detail..."
              style={{ resize: 'vertical' }}
            />
          </div>
          
          <button type="submit" className="btn btn--primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
            {loading ? 'submitting...' : <><Send size={16} /> submit ticket</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HelpModal;
