import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { branches, quizQuestions } from '../quizConfig';
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

  const totalSteps = quizQuestions.length > 0 ? quizQuestions.length + 2 : 2;

  const handleNext = () => {
    if (step === 0 && !branch && !otherBranch) {
      setError('please select an option.');
      return;
    }
    if (step > 0 && step <= quizQuestions.length) {
      const q = quizQuestions[step - 1];
      if (!answers[q.id]) {
        setError('please select an answer.');
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
      setError(err.message || 'failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (type: 'branch' | 'answer', value: string, qId?: string) => {
    if (type === 'branch') {
      setBranch(value);
      if (value !== 'Other') {
        setTimeout(() => { setError(null); setStep(s => s + 1); }, 300);
      }
    } else if (type === 'answer' && qId) {
      setAnswers(prev => ({ ...prev, [qId]: value }));
      setTimeout(() => { setError(null); setStep(s => s + 1); }, 300);
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
          <span className="quiz-eyebrow">STEP 01 // {totalSteps < 10 ? `0${totalSteps}` : totalSteps}</span>
          <h2 className="quiz-question">what is your engineering branch?</h2>
          <p className="quiz-subtitle">this helps calibrate the roadmap to your existing domain knowledge.</p>
          
          <div className="options-grid">
            {branches.map((b) => (
              <button
                key={b}
                type="button"
                className={`option-btn ${branch === b ? 'selected' : ''}`}
                onClick={() => selectOption('branch', b)}
              >
                <div className="radio-indicator"></div>
                <span>{b.toLowerCase()}</span>
              </button>
            ))}
          </div>

          {branch === 'Other' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{marginTop: '1rem'}}>
              <input 
                className="input"
                type="text" 
                placeholder="specify branch..." 
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
      const displayStep = step + 1;
      return (
        <motion.div 
          className="quiz-step"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          key={`step-${step}`}
        >
          <span className="quiz-eyebrow">STEP {displayStep < 10 ? `0${displayStep}` : displayStep} // {totalSteps < 10 ? `0${totalSteps}` : totalSteps}</span>
          <h2 className="quiz-question">{q.text.toLowerCase()}</h2>
          
          <div className="options-stack">
            {q.options.map((opt: string) => (
              <button
                key={opt}
                type="button"
                className={`option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
                onClick={() => selectOption('answer', opt, q.id)}
              >
                <div className="radio-indicator"></div>
                <span>{opt.toLowerCase()}</span>
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
          <span className="quiz-eyebrow">FINAL STEP</span>
          <h2 className="quiz-question">any specific constraints?</h2>
          <p className="quiz-subtitle">mention dream companies, specific frameworks you like, or timelines.</p>
          
          <textarea 
            className="input quiz-textarea"
            rows={5}
            placeholder="e.g. targeting product-based startups, no leetcode, focus on frontend..."
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
          />
        </motion.div>
      );
    }
  };

  return (
    <div className="lumen-quiz">
      {/* Left Pane - Atmospheric */}
      <div className="quiz-visual">
        <div className="quiz-logo" onClick={() => navigate('/dashboard')}>
          <Map className="icon" size={20} />
          <span className="wordmark">pathforge</span>
        </div>

        <div className="quiz-visual__inner">
          <div className="quiz-visual__apparatus">
            {/* Abstract UI representation of nodes connecting */}
            <div className="node-grid">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={`node ${i === step % 9 ? 'active' : ''}`} />
              ))}
            </div>
            <div className="glow-sphere"></div>
          </div>
          
          <div className="quiz-visual__text">
            <h1 className="quiz-visual__title">
              engineering<br/>
              <em>trajectory.</em>
            </h1>
            <p>calibrating constraints to generate your optimized timeline.</p>
            
            <div className="quiz-progress-metrics">
              <div className="metric">
                <span className="metric-val">{Math.round(((step) / totalSteps) * 100)}%</span>
                <span className="metric-label">calibrated</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="quiz-form-side">
        <div className="quiz-form__inner">
          <div className="quiz-progress-bar">
            <div 
              className="quiz-progress-fill" 
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <div className="quiz-content">
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert alert--error mb-6">
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>

            <div className="quiz-controls">
              {step > 0 ? (
                <button className="btn btn--outline" onClick={handlePrev} disabled={loading}>
                  <ArrowLeft size={16} /> back
                </button>
              ) : (
                <button className="btn btn--outline" onClick={() => navigate('/dashboard')}>cancel</button>
              )}
              
              {step < totalSteps - 1 ? (
                /* The Continue button is visually less prominent since auto-advance handles the main flow, 
                   but we keep it for "Other" branch text input or fallback. */
                <button className="btn btn--primary" onClick={handleNext}>
                  next <ArrowRight size={16} />
                </button>
              ) : (
                <button className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'generating...' : 'deploy roadmap'}
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
