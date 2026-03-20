# 한국어 Flashcards

A Korean SRS (Spaced Repetition) flashcard app built with Next.js 14, Supabase, and Tailwind CSS.

## Features

- 🃏 Anki-style SM-2 spaced repetition algorithm
- 👤 User accounts (email/password via Supabase Auth)
- 🗂️ Categorised card decks
- 📊 Progress stats with SRS distribution
- ➕ Add your own cards
- 🌐 Deployable to Vercel for free

---

## Getting Started

### 1. Clone & install

```bash
git clone <your-repo>
cd korean-flashcards
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In the SQL Editor, run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from **Settings → API**

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Seed your first deck

After signing up, run this in the Supabase SQL Editor to add the starter deck to your account:

```sql
select seed_starter_deck('<your-user-id-from-auth-table>');
```

Find your user ID in **Authentication → Users** in the Supabase dashboard.

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Or connect your GitHub repo to Vercel for automatic deploys on every push.

---

## Project Structure

```
app/
  (auth)/login/     → Login / signup page
  study/            → Main flashcard study view
  deck/             → Browse & manage cards
  stats/            → Progress & SRS stats
  api/cards/        → REST API: CRUD for cards
  api/reviews/      → REST API: SRS ratings & stats
components/
  Nav.tsx           → Top navigation
  Flashcard.tsx     → Flip card with answer buttons
lib/
  supabase.ts       → Browser Supabase client
  supabase-server.ts → Server Supabase client
  srs.ts            → SM-2 algorithm
  types.ts          → TypeScript types
supabase/
  schema.sql        → Database tables, RLS policies, seed function
```

---

## SRS Rating Guide

| Button | Meaning | Next review |
|--------|---------|-------------|
| Again  | Didn't know it | 10 minutes |
| Hard   | Knew it but struggled | Slightly longer than before |
| Good   | Knew it | SM-2 interval |
| Easy   | Too easy | Extended interval |
