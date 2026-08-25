# Career Roadmap Guide

An AI-powered career roadmap platform for engineering students, built with React, Express, Supabase, and Groq.

## 🚀 Local Development Setup

### 1. Environment Variables

**Backend (`backend/.env`)**
Create this file and set the following:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
GROQ_API_KEY=your_groq_api_key
ADMIN_EMAIL=admin@careerroadmap.test
PORT=3000
ALLOWED_ORIGIN=http://localhost:5173
```

**Frontend (`frontend/.env`)**
Create this file and set the following:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000/api
```

### 2. Running Locally

Open two terminals.

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` and backend at `http://localhost:3000`.

---

## 🌍 Deployment (Vercel / Netlify)

1. **Deploying the Backend (Render/Heroku/Vercel)**
   - Push your code to GitHub.
   - Connect your repository to your hosting provider.
   - Set the Root Directory to `backend`.
   - Add all backend Environment Variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `GROQ_API_KEY`, `ADMIN_EMAIL`) in the hosting provider's dashboard settings.
   - Make sure to update `ALLOWED_ORIGIN` to your future frontend deployed URL.
   - Deploy. You will receive a deployed backend URL (e.g., `https://my-backend.onrender.com`).

2. **Deploying the Frontend (Vercel)**
   - Connect your repository to Vercel.
   - Set the Framework Preset to `Vite`.
   - Set the Root Directory to `frontend`.
   - **Crucial Step**: In the Vercel Environment Variables section, add:
     - `VITE_SUPABASE_URL`: (your url)
     - `VITE_SUPABASE_ANON_KEY`: (your anon key)
     - `VITE_API_BASE_URL`: `https://my-backend.onrender.com/api` (Point this to your deployed backend, NOT localhost).
   - Deploy.

---

## 📱 Progressive Web App (PWA)

This application is built as a Progressive Web App (PWA) using standard web technologies. It does not use Capacitor or React Native to generate an APK. Instead, it utilizes a Web Manifest and a Service Worker for offline caching and native-like installation.

**How to Install the App Natively:**
1. Open the deployed frontend URL in your mobile or desktop browser (e.g., Chrome, Safari).
2. Follow the browser prompt to **"Add to Home Screen"** or click the install icon in the URL bar.
3. The app will install directly to your device and run in a standalone, immersive window without browser UI, functioning exactly like a native application!
