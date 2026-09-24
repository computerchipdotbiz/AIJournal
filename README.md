# Rosebud AI — Self-Reflection Journal

A personal, AI-powered interactive journal inspired by [Rosebud.app](https://rosebud.app). Built for emotional clarity, CBT-style cognitive reframing, habit tracking, and automated weekly syntheses.

---

## ✨ Core Features

- **Interactive Socratic Mirror**: AI listens to your thoughts and asks 1 gentle, probing question at a time to help you uncover deeper self-awareness.
- **Thought Frameworks**: Includes guided prompts for *Morning Intentions*, *Brain Dump & Unload*, *CBT Anxiety Unpacker*, *Evening Gratitude*, and *Decision Helper*.
- **Auto-Synthesis**: Automatically generates a 1-sentence TL;DR summary, calculates emotional mood score (1–10), tags topics, and extracts actionable commitments.
- **Voice Dictation**: Tap the microphone to dictate thoughts hands-free.
- **Pattern Recognition**: Weekly review dashboard with mood trends, recurring feelings, and AI-synthesized breakthroughs.
- **Single-User Security**: Passcode lock screen for ultimate diary privacy.
- **100% Data Ownership**: Instant one-click export to Markdown (`.md`) or JSON (`.json`).
- **Free Hosting & Custom Domain**: Host on Vercel ($0/mo) with free automatic SSL for your own custom domain.

---

## 🚀 Quick Start (Local Development)

### 1. Run the App
```bash
# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Add Your Free Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and click **Create API Key** (100% free with 15 RPM & 1M tokens/min).
2. Either:
   - Paste it directly into the app by clicking the **Settings (⚙️)** icon in the top right, OR
   - Add it to `.env.local`:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```

---

## ☁️ Free Cloud Sync & Semantic Memory (Supabase)

The app works locally in your browser immediately. If you want multi-device cloud sync and AI vector memory:

1. Sign up for a free account at [supabase.com](https://supabase.com).
2. Create a new project (e.g. `journal-app`).
3. In Supabase, go to **SQL Editor** -> click **New Query**.
4. Open [`lib/supabase/schema.sql`](lib/supabase/schema.sql) in this repo, copy its entire contents, paste it into the Supabase SQL editor, and click **Run**.
5. In Supabase, go to **Project Settings** -> **API**, and copy your `Project URL` and `anon/public key`.
6. Add them to `.env.local` or enter them in the app's **Settings**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

---

## 🌐 100% Free Hosting with Your Custom Domain (Vercel)

You can host this app with zero monthly fees, total control of updates, and your own domain name:

### Step 1: Push Code to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (make it **Private** so your journal code is yours alone).
2. In your terminal inside this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Rosebud AI Journal"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel (Hobby Tier — $0/mo)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your private journal repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your Google AI Studio API key
   - *(Optional)* `NEXT_PUBLIC_SUPABASE_URL`
   - *(Optional)* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will build and deploy your app in under 60 seconds!
6. Every time you push a git update, Vercel automatically deploys the latest version live with zero downtime.

### Step 3: Connect Your Custom Domain
1. In your Vercel project, go to **Settings** -> **Domains**.
2. Type your domain (e.g., `journal.yourdomain.com` or `yourdomain.com`) and click **Add**.
3. Log in to your domain registrar (Cloudflare, Namecheap, Porkbun, Google/Squarespace):
   - For a subdomain (e.g., `journal.yourdomain.com`): Add a **CNAME** record pointing to `cname.vercel-dns.com`.
   - For an apex domain (e.g., `yourdomain.com`): Add an **A** record pointing to `76.76.21.21`.
4. Vercel automatically verifies the records and issues a free Let's Encrypt SSL certificate (HTTPS) within 60 seconds.

---

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4, Lucide Icons
- **AI SDK**: Vercel AI SDK (`ai`), `@ai-sdk/google` (Gemini 2.0 Flash)
- **Database / Memory**: Supabase PostgreSQL with `pgvector` extension
- **Effects**: `canvas-confetti`
