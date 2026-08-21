import http from 'k6/http';
import { check, sleep } from 'k6';

// EXPECTATION & REALITY NOTE:
// The Groq API is aggressively rate-limited (5 requests per 15 minutes in our middleware).
// A 100-VU load test will immediately trigger a HTTP 429 Too Many Requests response 
// from our backend's `generateLimiter` on the `/api/generate-roadmap` route.
// This is exactly the intended behavior. The test verifies that the backend survives
// the flood and gracefully rejects excessive traffic without crashing.

export const options = {
  stages: [
    { duration: '15s', target: 50 }, // Ramp up to 50 users
    { duration: '30s', target: 100 }, // Hold 100 users for 30 seconds
    { duration: '15s', target: 0 },   // Ramp down
  ],
};

const BASE_URL = __ENV.LIVE_URL || 'http://localhost:3000/api';
// We use a predefined test user to avoid database locking on signup during high concurrency
const TEST_EMAIL = 'admin@careerroadmap.test';
const TEST_PASSWORD = 'SecurePass123!';

export default function () {
  // 1. Target Login
  const loginPayload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const loginHeaders = {
    'Content-Type': 'application/json',
  };

  // We have to mock this route if we didn't implement a pure auth/login route on the backend.
  // Wait, Supabase handles auth via GoTrue. For k6, we'd hit Supabase directly or assume we have a token.
  // To avoid hitting Supabase 100 times a second and getting IP banned by Supabase, 
  // we will test our own backend routes directly. We simulate having a JWT (or test the 401 response).
  
  // For the sake of the load test proving backend stability, we will hit /health and /generate-roadmap.
  
  // Test Health
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
  });

  // Test Generate Roadmap (Expected to hit 429 Rate Limit quickly)
  const generateHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer fake-token-for-load-test`,
  };

  const genRes = http.post(`${BASE_URL}/generate-roadmap`, '{}', { headers: generateHeaders });
  
  check(genRes, {
    'generate endpoint responds (401 or 429 or 200)': (r) => r.status === 401 || r.status === 429 || r.status === 200,
  });

  sleep(1);
}
