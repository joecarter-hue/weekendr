# Weekendr — Deployment Guide

This gets you from zero to a live, working app. Takes about 45 minutes.

---

## Step 1 — Create your accounts (if you haven't already)

| Service | URL | What for |
|---------|-----|----------|
| GitHub | github.com | Hosts your code |
| Vercel | vercel.com | Runs the app (free) |
| Supabase | supabase.com | Database (free) |
| Anthropic | console.anthropic.com | AI plan generation |
| Resend | resend.com | Friday night emails |

---

## Step 2 — Set up Supabase

1. Create a new project at **supabase.com → New Project**
2. Give it a name (e.g. `weekendr`) and a strong password. Save that password somewhere.
3. Once it's ready, go to **SQL Editor** in the left sidebar
4. Paste the entire contents of `supabase-schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(keep this secret)*

---

## Step 3 — Get your API keys

**Anthropic:**
1. Go to **console.anthropic.com → API Keys → Create Key**
2. Copy the key (starts with `sk-ant-`)
3. Add $5 credit in Billing — enough for months of use

**Resend:**
1. Go to **resend.com → API Keys → Create API Key**
2. Copy the key (starts with `re_`)
3. Go to **Domains** and add your domain (or use the free Resend test domain to start)
4. Copy your confirmed sending email address

---

## Step 4 — Push to GitHub

In your terminal:

```bash
# Navigate to the weekendr folder
cd path/to/weekendr

# Initialise git and push to a new GitHub repo
git init
git add .
git commit -m "Initial Weekendr commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/weekendr.git
git push -u origin main
```

*(Create the repo on github.com first — click New Repository, name it `weekendr`, keep it private)*

---

## Step 5 — Deploy to Vercel

1. Go to **vercel.com → New Project**
2. Import your `weekendr` GitHub repository
3. Vercel detects Next.js automatically — click **Deploy**
4. It will fail on first deploy (no env vars yet) — that's fine

---

## Step 6 — Add environment variables

In Vercel → your project → **Settings → Environment Variables**, add each of these:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase Settings → API (secret) |
| `ANTHROPIC_API_KEY` | From Anthropic console |
| `RESEND_API_KEY` | From Resend |
| `RESEND_FROM_EMAIL` | e.g. `hello@weekendr.app` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL e.g. `https://weekendr.vercel.app` |
| `CRON_SECRET` | Any long random string — make one up |

After adding all variables: **Deployments → Redeploy** (latest deployment)

---

## Step 7 — Test it

1. Open your Vercel URL
2. Tap **Build my weekend now**
3. Fill in the quick profile (Fitzroy, 2 people, mixed, balanced)
4. Watch the generating screen
5. You should land on 3 plan cards — swipe through one and you'll hit the Micky send-off

If something breaks, check **Vercel → your project → Functions** tab for error logs.

---

## Step 8 — Set up the full profile (Path A)

Coming soon — the setup flow and Friday delivery cron are in the next build phase.

---

## The cron jobs (automated Friday delivery)

These are defined in `vercel.json` and fire automatically once deployed:

| Job | Time | What it does |
|-----|------|-------------|
| `/api/cron/friday` | 8am UTC (6pm AEST) Friday | Generates plans for all users, sends email |
| `/api/cron/saturday` | 9pm UTC (7am AEST) Saturday | Checks weather — sends pivot email if changed |
| `/api/cron/sunday` | 9am UTC (7pm AEST) Sunday | Sends Memory Wall prompt |

**Cron jobs only run on Vercel's paid plan (Pro, $20/month).** On the free Hobby plan, you can trigger them manually by visiting the URL with the secret: `https://your-app.vercel.app/api/cron/friday?secret=YOUR_CRON_SECRET`

---

## Custom domain (optional but nice)

1. Buy `weekendr.app` or similar at Cloudflare (~$12/year)
2. Vercel → your project → **Settings → Domains → Add**
3. Follow Vercel's DNS instructions
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain

---

## Questions?

Any issues — share the error from Vercel's function logs and we'll fix it.
