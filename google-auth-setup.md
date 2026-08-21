# Step-by-Step Guide: Enabling Google Auth in Supabase

To make the "Sign in with Google" button work, you need to configure OAuth credentials in both Google Cloud and your Supabase Dashboard.

## Phase 1: Google Cloud Console
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project (or select an existing one).
3. In the left sidebar, navigate to **APIs & Services > OAuth consent screen**.
   - Choose **External** and click Create.
   - Fill in the required fields (App Name: `Career Roadmap`, User Support Email, Developer Contact Info).
   - Save and Continue through Scopes and Test Users (no special scopes needed beyond default `email`, `profile`, `openid`).
4. Navigate to **APIs & Services > Credentials**.
5. Click **+ CREATE CREDENTIALS** at the top, and select **OAuth client ID**.
6. Set **Application type** to **Web application**.
7. Under **Authorized redirect URIs**, you must add your Supabase project's callback URL.
   - You can find this in your Supabase Dashboard under *Authentication > URL Configuration > Site URL*.
   - It usually looks like: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
8. Click **Create**.
9. A modal will pop up with your **Client ID** and **Client Secret**. Keep this open.

## Phase 2: Supabase Dashboard
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your `Career Roadmap` project.
3. In the left sidebar, go to **Authentication > Providers**.
4. Find **Google** in the list and click it to expand the settings.
5. Toggle **Enable Sign in with Google** to ON.
6. Paste the **Client ID** from Google into the Client ID field.
7. Paste the **Client Secret** from Google into the Client Secret field.
8. Click **Save**.

## Phase 3: Final Test
That's it! 
- Go back to your local app (`http://localhost:5176/auth`).
- Click **Sign in with Google**.
- A Google popup will appear. Once you sign in, Supabase will instantly create a row in the `auth.users` table, which will trigger our SQL function to create a profile row in the `profiles` table, and finally redirect you to the Dashboard!
