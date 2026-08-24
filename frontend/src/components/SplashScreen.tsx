import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

interface SplashScreenProps {
  isAppReady: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isAppReady }) => {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    // Enforce a minimum display time of 1.8 seconds for the aesthetic
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // When both the app is ready and the minimum 1.8s has elapsed, trigger fade out
    if (isAppReady && minTimeElapsed) {
      setFade(true);
      // Wait for the 0.5s CSS transition to finish before completely unmounting
      const removeTimer = setTimeout(() => {
        setShow(false);
      }, 500);
      return () => clearTimeout(removeTimer);
    }
  }, [isAppReady, minTimeElapsed]);

  if (!show) return null;

  return (
    <div className={`splash-container ${fade ? 'splash-fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-wrapper">
          {/* We use a text wordmark as requested, or the PNG logo. 
              The prompt asked for: "Display the 'PATHFORGE' brand name with a smooth pulse/fade animation, accompanied by a sleek, minimal glowing loader bar underneath." */}
          <h1 className="splash-brand">PATHFORGE</h1>
        </div>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
