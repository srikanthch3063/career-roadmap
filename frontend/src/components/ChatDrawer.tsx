import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Send, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import { track } from '../utils/tracker';

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
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    track('mentor_message', { question: userMessage.substring(0,120) });
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
      }, 800); // Faster cycle

      // Artificial delay to guarantee the thinking state is visible to the user
      await new Promise(resolve => setTimeout(resolve, 1500));

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
              // Synthetic delay to create a typing effect if network is too fast
              await new Promise(resolve => setTimeout(resolve, 30));
              
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

  const handleQuickReply = (text: string) => {
    setInput(text);
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
            className="lumen-chat-overlay"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="lumen-chat-drawer"
            aria-label="AI Career Mentor Chat"
          >
            <header className="lumen-chat-header">
              <div>
                <h3 className="lumen-chat-title">AI Career Mentor</h3>
                <p className="lumen-chat-subtitle">Ask anything about your roadmap</p>
              </div>
              <button onClick={onClose} className="lumen-chat-close" aria-label="Close chat">
                <X size={20} />
              </button>
            </header>

            <div className="lumen-chat-messages">
              {messages.length === 0 && (
                <div className="lumen-chat-system-bubble">
                  <p>Hi {userName}, {getGreeting()}. I'm your AI career mentor. How can I help you execute this roadmap today?</p>
                  <div className="lumen-chat-quick-replies">
                    <button className="lumen-chat-chip" onClick={() => handleQuickReply('Review my roadmap')}>Review my roadmap</button>
                    <button className="lumen-chat-chip" onClick={() => handleQuickReply('Suggest next skill')}>Suggest next skill</button>
                    <button className="lumen-chat-chip" onClick={() => handleQuickReply('Salary insights')}>Salary insights</button>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.role === 'user' ? 'lumen-chat-bubble-user' : 'lumen-chat-bubble-ai'}>
                  {msg.content}
                </div>
              ))}
              
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px', backgroundColor: 'transparent', color: '#94A3B8', fontFamily: 'var(--font-mono)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="lumen-loader" style={{ width: '12px', height: '12px', borderWidth: '1px' }} /> {thinkingMessage}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="lumen-chat-input-container">
              <label className="lumen-chat-input-pill">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  aria-label="Ask a question"
                />
                <button 
                  onClick={handleSend} 
                  disabled={loading || !input.trim()}
                  className="lumen-chat-send"
                  aria-label="Send message"
                >
                  <Send size={14} />
                </button>
              </label>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;
