import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { branches } from '../quizConfig';
import { Map, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './Quiz.css';

const Quiz = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); 
  const [branch, setBranch] = useState('');
  const [otherBranch, setOtherBranch] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetchQuizConfig();
  }, []);

  const fetchQuizConfig = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/roadmap/config`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (data.quizQuestions) {
        setQuizQuestions(data.quizQuestions);
      }
    } catch (err) {
      console.error('Failed to load quiz config', err);
    }
  };

  const totalSteps = quizQuestions.length > 0 ? quizQuestions.length + 2 : 2;

  const handleNext = () => {
    if (step === 0 && !branch) {
      setError('Please select an option.');
      return;
    }
    if (step > 0 && step <= quizQuestions.length) {
      const q = quizQuestions[step - 1];
      if (!answers[q.id]) {
        setError('Please select an answer.');
        return;
      }
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const finalBranch = branch === 'Other' ? otherBranch : branch;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ branch: finalBranch })
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      const { error: quizError } = await supabase
        .from('quiz_responses')
        .insert({
          user_id: user.id,
          answers,
          free_text: freeText,
        });

      if (quizError) throw quizError;

      navigate('/results?generate=true');
    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  // Automatically go next if clicking an option (except on free text step)
  const selectOption = (type: 'branch' | 'answer', value: string, qId?: string) => {
    if (type === 'branch') {
      setBranch(value);
      if (value !== 'Other') {
        setTimeout(() => handleNext(), 200);
      }
    } else if (type === 'answer' && qId) {
      setAnswers(prev => ({ ...prev, [qId]: value }));
      setTimeout(() => handleNext(), 200);
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <motion.div 
          className="quiz-step"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          key="step-0"
        >
          <span className="quiz-eyebrow">Step 1 of {totalSteps}</span>
          <h2>What is your engineering branch?</h2>
          <p className="quiz-subtitle">This helps us tailor your roadmap specifically to your field.</p>
          
          <div className="options-stack">
            {branches.map((b) => (
              <button
                key={b}
                type="button"
                className={`option-btn ${branch === b ? 'selected' : ''}`}
                onClick={() => selectOption('branch', b)}
              >
                <div className="radio-circle"></div>
                {b}
              </button>
            ))}
          </div>

          {branch === 'Other' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
              <input 
                className="input"
                type="text" 
                placeholder="Specify your branch..." 
                value={otherBranch}
                onChange={(e) => setOtherBranch(e.target.value)}
                autoFocus
              />
            </motion.div>
          )}
        </motion.div>
      );
    }

    if (step > 0 && step <= quizQuestions.length) {
      const q = quizQuestions[step - 1];
      return (
        <motion.div 
          className="quiz-step"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          key={`step-${step}`}
        >
          <span className="quiz-eyebrow">Step {step + 1} of {totalSteps}</span>
          <h2>{q.text}</h2>
          
          <div className="options-stack">
            {q.options.map((opt: string) => (
              <button
                key={opt}
                type="button"
                className={`option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => selectOption('answer', opt, q.id)}
              >
                <div className="radio-circle"></div>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      );
    }

    if (step === quizQuestions.length + 1) {
      return (
        <motion.div 
          className="quiz-step"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          key="step-final"
        >
          <span className="quiz-eyebrow">Final Step</span>
          <h2>Anything else we should know?</h2>
          <p className="quiz-subtitle">Tell us about specific technologies you like, dream companies, or constraints.</p>
          
          <textarea 
            className="quiz-textarea"
            rows={5}
            placeholder="E.g., I want to work in climate tech, or I have a strong background in competitive programming..."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
          />
        </motion.div>
      );
    }
  };

  return (
    <div className="quiz-split">
      {/* Left Pane - Atmospheric */}
      <div className="quiz-context-pane">
        <div className="quiz-logo" onClick={() => navigate('/dashboard')}>
          <Map className="icon" size={24} />
          <span>PathForge</span>
        </div>

        <div className="quiz-context-content">
          <div className="quiz-progress-text">
            {Math.round(((step) / totalSteps) * 100)}% Complete
          </div>
          <h1 className="quiz-context-title">
            Engineering<br />
            your<br />
            trajectory.
          </h1>
          <p className="quiz-context-desc">
            We use these parameters to generate a highly opinionated, step-by-step roadmap tailored to your specific constraints.
          </p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="quiz-form-pane">
        <div className="quiz-form-container">
          
          <div className="quiz-progress-line">
            <div 
              className="quiz-progress-fill" 
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="quiz-inner">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert-error quiz-error">
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            <div className="quiz-controls">
              {step > 0 ? (
                <button className="btn btn-outline" onClick={handlePrev} disabled={loading}>
                  <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back
                </button>
              ) : (
                <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
              )}
              
              {step < totalSteps - 1 ? (
                <button className="btn btn-primary" onClick={handleNext} style={{ gap: '6px' }}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ gap: '6px' }}>
                  {loading ? 'Generating...' : 'Deploy Roadmap'}
                  {!loading && <ArrowRight size={16} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
