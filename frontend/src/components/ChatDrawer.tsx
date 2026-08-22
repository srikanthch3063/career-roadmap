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
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [userName, setUserName] = useState('');

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata;
        const name = meta?.full_name || meta?.name || data.user.email?.split('@')[0] || 'there';
        setUserName(name.toLowerCase());
      }
    });
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'good morning';
    if (hour < 18) return 'good afternoon';
    return 'good evening';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);
    setThinkingMessage('looking into preferences...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
      
      const thinkingInterval = setInterval(() => {
        setThinkingMessage(prev => {
          if (prev === 'looking into preferences...') return 'analyzing roadmap context...';
          if (prev === 'analyzing roadmap context...') return 'synthesizing answer...';
          return 'looking into preferences...';
        });
      }, 2000);

      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ question: userMessage, roadmapContext })
      });

      if (!response.ok) throw new Error('Failed to fetch answer');
      if (!response.body) throw new Error('ReadableStream not yet supported in this browser.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let aiMessage = '';

      setMessages(prev => [...prev, { role: 'ai', content: '' }]);
      clearInterval(thinkingInterval);
      setLoading(false); // Switch from thinking to streaming

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        
        const lines = chunkValue.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            let parsed;
            try {
              parsed = JSON.parse(dataStr);
            } catch (e) {
              continue; // ignore parse errors for partial chunks
            }
            
            if (parsed.error) throw new Error(parsed.error);
            
            if (parsed.chunk) {
              aiMessage += parsed.chunk;
              // Force plain text by stripping markdown chars: *, _, #, `, ~, >, and [] links
              const cleanMessage = aiMessage.replace(/[*_#`~>]/g, '').replace(/\[.*?\]\(.*?\)/g, '');
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = cleanMessage;
                return newMessages;
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I encountered an error. Please try again.' }]);
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
              backgroundColor: 'hsl(var(--background) / 0.5)',
              backdropFilter: 'blur(8px)',
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
                  <p>hi {userName}, {getGreeting()}. ask me anything about your career path or roadmap.</p>
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
                <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '12px', backgroundColor: 'transparent', color: 'var(--color-rule-2)', fontFamily: 'var(--font-label)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Loader2 size={12} className="spin" /> {thinkingMessage}
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
