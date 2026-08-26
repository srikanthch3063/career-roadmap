import { useEffect, useRef } from 'react';
import { track } from '../utils/tracker';

export function useTimeTracker(page: string) {
  const startRef = useRef<number>(Date.now());
  const sentRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    const send = () => {
      if (sentRef.current) return;
      const sec = Math.max(1, Math.round((Date.now() - startRef.current)/1000));
      // ignore <3s bounces, >4h likely idle
      if (sec < 3 || sec > 14400) return;
      sentRef.current = true;
      track('time_spent', { page, duration_sec: sec });
    };
    const onVis = () => { if (document.visibilityState === 'hidden') send(); };
    window.addEventListener('beforeunload', send);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('beforeunload', send);
      document.removeEventListener('visibilitychange', onVis);
      send();
    };
  }, [page]);
}
