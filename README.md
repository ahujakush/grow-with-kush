# Kush Growth OS — Supabase Tracker

This is a separate tracker app for Kush's career + DSA + BYC progress.

## Supabase project

Project name: `kush-growth-os-tracker`
Project ref: `rjgeoingulhmvgruphjv`
Project URL: `https://rjgeoingulhmvgruphjv.supabase.co`

This project is separate from BYC Supabase. BYC Supabase was not touched.

## Tables created

- `daily_logs`
- `flexible_topics`
- `byc_lab_tasks`

RLS is enabled. Users can only read/write their own rows.

## How to run locally

Open `index.html` in your browser.

## How to deploy free

Easiest:
1. Create a GitHub repo.
2. Upload these files.
3. Go to Vercel.
4. Import the repo.
5. Deploy.
6. You will get a free `.vercel.app` link.

## Supabase auth settings

In Supabase dashboard:
1. Open project `kush-growth-os-tracker`.
2. Go to Authentication → URL Configuration.
3. Add your Vercel domain as Site URL after deploy.
4. Add it to Redirect URLs too.

## Data rule

- Daily Log = actual daily learning.
- Flexible Topics = topic mastery.
- Roadmap = direction only.

If teacher teaches HashMap earlier:
- Add HashMap in Daily Log.
- Update HashMap in Flexible Topics.
- Do not fake-tick the planned topic.
