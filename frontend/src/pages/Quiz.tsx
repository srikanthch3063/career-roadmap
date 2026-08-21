import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { branches, quizQuestions } from '../quizConfig';
import { Map } from 'lucide-react';
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

  const handleNext = () => {
    if (step === 0 && !branch) {
      setError('Please select a branch.');
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
      setError(err.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    if (step === 0) {
      return (
        <div className="quiz-step">
          <h2>What is your engineering branch?</h2>
          <p className="subtitle">This helps us tailor your roadmap specifically to your field.</p>
          <div className="options-grid">
            {branches.map((b) => (
              <label key={b} className={`option-card ${branch === b ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="branch" 
                  value={b} 
                  checked={branch === b}
                  onChange={(e) => setBranch(e.target.value)}
                  className="hidden-radio"
                />
                {b}
              </label>
            ))}
          </div>
          {branch === 'Other' && (
            <div style={{ marginTop: '1.5rem' }}>
              <input 
                className="input"
                type="text" 
                placeholder="Please specify your branch..." 
                value={otherBranch}
                onChange={(e) => setOtherBranch(e.target.value)}
              />
            </div>
          )}
        </div>
      );
    }

    if (step > 0 && step <= quizQuestions.length) {
      const q = quizQuestions[step - 1];
      return (
        <div className="quiz-step">
          <h2>{q.text}</h2>
          <div className="options-list">
            {q.options.map((opt) => (
              <label key={opt} className={`option-card ${answers[q.id] === opt ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name={q.id} 
                  value={opt} 
                  checked={answers[q.id] === opt}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="hidden-radio"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (step === quizQuestions.length + 1) {
      return (
        <div className="quiz-step">
          <h2>Anything else we should know?</h2>
          <p className="subtitle">Tell us about specific technologies you like, dream companies, or any constraints.</p>
          <div>
            <textarea 
              rows={6}
              placeholder="E.g., I really want to work in climate tech, or I have a strong background in competitive programming..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
            />
          </div>
        </div>
      );
    }
  };

  const totalSteps = quizQuestions.length + 2;
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>
        
        {error && (
          <div style={{ padding: '1.5rem 2.5rem 0' }}>
            <div className="alert-error" style={{ marginBottom: 0 }}>{error}</div>
          </div>
        )}

        <div className="quiz-content">
          {renderStepContent()}
        </div>

        <div className="quiz-footer">
          {step > 0 ? (
            <button className="btn btn-outline" onClick={handlePrev} disabled={loading}>Back</button>
          ) : (
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Cancel</button>
          )}
          
          {step < totalSteps - 1 ? (
            <button className="btn btn-primary" onClick={handleNext}>Next Step</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Generate Roadmap'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
