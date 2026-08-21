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

## 📱 Building the Android APK with Capacitor

When you are ready to build the Android APK, you must point the frontend to the deployed backend so the physical phone can reach it (a phone cannot reach `localhost:3000`).

**Steps to build:**

1. **Update Environment Variable for Production**
   In `frontend/.env.production` (or just your `.env`), set:
   ```env
   VITE_API_BASE_URL=https://your-deployed-backend-url.com/api
   ```

2. **Build the Web App**
   ```bash
   cd frontend
   npm run build
   ```

3. **Sync to Capacitor**
   ```bash
   npx cap sync
   ```

4. **Open in Android Studio to Build APK**
   ```bash
   npx cap open android
   ```
   - In Android Studio, wait for Gradle to sync.
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - Once finished, you will find your `app-debug.apk` in `frontend/android/app/build/outputs/apk/debug/`.

**Note on Network Security:** 
If your backend is deployed with HTTPS, Android will allow the connection automatically. If you attempt to connect to a cleartext HTTP backend on a local network for testing, you will need to add `android:usesCleartextTraffic="true"` to your `AndroidManifest.xml`.
