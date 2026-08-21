import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapContext: any;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, roadmapContext }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ question: userMessage, roadmapContext })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch answer');

      setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'hsl(var(--background) / 0.8)',
              backdropFilter: 'blur(4px)',
              zIndex: 100
            }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0, right: 0, bottom: 0,
              width: '400px',
              maxWidth: '100%',
              backgroundColor: 'hsl(var(--card))',
              borderLeft: '1px solid hsl(var(--border))',
              zIndex: 101,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} color="hsl(var(--primary))" />
                <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Ask AI Mentor</h3>
              </div>
              <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.5rem' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))', marginTop: '2rem' }}>
                  <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                  <p>Ask anything about your career roadmap. I'm here to help you understand the skills and plan your next steps.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    backgroundColor: msg.role === 'user' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                    color: msg.role === 'user' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
                    fontSize: '0.9375rem',
                    lineHeight: '1.5',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '12px',
                    borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '12px',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '12px', backgroundColor: 'hsl(var(--secondary))' }}>
                  <Loader2 size={16} className="spinner" />
                </div>
              )}
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'transparent',
                    color: 'inherit',
                    outline: 'none'
                  }}
                />
                <button 
                  onClick={handleSend} 
                  disabled={loading || !input.trim()}
                  className="btn btn-primary"
                  style={{ padding: '0 1rem' }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;
