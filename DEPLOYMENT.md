# Deployment (Vercel + Supabase)

## 1. Supabase project

You already have a Supabase project. Before going live:

1. **Auth URL config** — Supabase Dashboard → Authentication → URL Configuration:
   - Site URL: your production URL (e.g. `https://your-app.vercel.app`)
   - Redirect URLs: add `https://your-app.vercel.app/**`
2. **Database migrations** — push the schema to the Supabase Postgres instance:
   ```bash
   npm run db:push
   ```
3. **Storage buckets** — if not already created, run:
   ```bash
   npx tsx scripts/setup-storage.ts
   ```
4. Confirm Row Level Security (RLS) policies are enabled on all tables that don't go through `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Push to GitHub

```bash
git add -A
git commit -m "Initial commit"
gh repo create esignee --private --source=. --remote=origin --push
# or: create the repo on github.com, then
#   git remote add origin <repo-url>
#   git push -u origin main
```

## 3. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo. Vercel auto-detects Next.js — no build config needed.
2. Add the environment variables below in **Project Settings → Environment Variables** (Production + Preview):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | from Supabase → Project Settings → API (server-only, never `NEXT_PUBLIC_*`) |
| `DATABASE_URL` | Supabase → Project Settings → Database → **Connection pooling** URI (port `6543`, pgbouncer). Required for serverless — do not use the direct `5432` connection. |
| `NEXT_PUBLIC_SITE_URL` | your Vercel production URL |
| `SMTP_LOGIN`, `SMTP_KEY`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | from Brevo → SMTP & API |

3. Click **Deploy**.
4. Once deployed, go back to Supabase Auth URL Configuration and confirm the Site URL / Redirect URLs match the real `*.vercel.app` domain Vercel assigned (or your custom domain).

## 4. Custom domain (optional)

Add it under Vercel → Project → Settings → Domains, then update `NEXT_PUBLIC_SITE_URL` and the Supabase Auth redirect URLs to match.

## Notes

- The app already uses the pgbouncer-safe Postgres client config (`prepare: false` in [lib/db/index.ts](lib/db/index.ts)), so it's safe to run on Vercel's serverless functions.
- Build may print a warning about `@supabase/ssr` using a Node.js API in the Edge Runtime (inside `lib/supabase/middleware.ts`). This is a known, harmless warning from the Supabase SSR package and does not affect the deployed app.
- Netlify works too via the [`@netlify/plugin-nextjs`](https://github.com/netlify/netlify-plugin-nextjs) adapter (auto-installed when you import the repo on Netlify), but Vercel is the natural fit for Next.js and requires zero extra config.
