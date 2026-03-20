-- Run this in your Supabase project → SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Cards table
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  korean text not null,
  english text not null,
  romanization text,
  category text default 'general',
  is_public boolean default false,
  created_at timestamptz default now()
);

-- SRS review state per user per card
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  card_id uuid references public.cards on delete cascade,
  interval_days int default 0,
  ease_factor float default 2.5,
  repetitions int default 0,
  due timestamptz default now(),
  stage text default 'new',   -- new | learning | review | mastered
  updated_at timestamptz default now(),
  unique(user_id, card_id)
);

-- Row Level Security
alter table public.cards enable row level security;
alter table public.reviews enable row level security;

-- Cards policies
create policy "Users can read their own cards" on public.cards
  for select using (auth.uid() = user_id);

create policy "Users can read public cards" on public.cards
  for select using (is_public = true);

create policy "Users can insert their own cards" on public.cards
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own cards" on public.cards
  for update using (auth.uid() = user_id);

create policy "Users can delete their own cards" on public.cards
  for delete using (auth.uid() = user_id);

-- Reviews policies
create policy "Users can read their own reviews" on public.reviews
  for select using (auth.uid() = user_id);

create policy "Users can insert their own reviews" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reviews" on public.reviews
  for update using (auth.uid() = user_id);

-- Function to seed starter deck for new user
create or replace function public.seed_starter_deck(p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  insert into public.cards (user_id, korean, english, romanization, category) values
    (p_user_id, '안녕하세요', 'Hello / Good day', 'annyeonghaseyo', 'greetings'),
    (p_user_id, '안녕히 가세요', 'Goodbye (to someone leaving)', 'annyeonghi gaseyo', 'greetings'),
    (p_user_id, '감사합니다', 'Thank you', 'gamsahamnida', 'greetings'),
    (p_user_id, '죄송합니다', 'I''m sorry', 'joesonghamnida', 'greetings'),
    (p_user_id, '천만에요', 'You''re welcome', 'cheonmaneyo', 'greetings'),
    (p_user_id, '이게 뭐예요?', 'What is this?', 'ige mwoyeyo?', 'phrases'),
    (p_user_id, '얼마예요?', 'How much is it?', 'eolmayeyo?', 'phrases'),
    (p_user_id, '어디예요?', 'Where is it?', 'eodiyeyo?', 'phrases'),
    (p_user_id, '모르겠어요', 'I don''t know', 'moreugeseoyo', 'phrases'),
    (p_user_id, '괜찮아요', 'It''s okay', 'gwaenchanayo', 'phrases'),
    (p_user_id, '도와주세요', 'Please help me', 'dowajuseyo', 'phrases'),
    (p_user_id, '맛있어요', 'It''s delicious', 'massisseoyo', 'food'),
    (p_user_id, '배고파요', 'I''m hungry', 'baegopayo', 'food'),
    (p_user_id, '물 주세요', 'Water, please', 'mul juseyo', 'food'),
    (p_user_id, '밥', 'Rice / Meal', 'bap', 'food'),
    (p_user_id, '가다', 'To go', 'gada', 'verbs'),
    (p_user_id, '오다', 'To come', 'oda', 'verbs'),
    (p_user_id, '먹다', 'To eat', 'meokda', 'verbs'),
    (p_user_id, '마시다', 'To drink', 'masida', 'verbs'),
    (p_user_id, '좋아하다', 'To like', 'joahada', 'verbs'),
    (p_user_id, '사람', 'Person', 'saram', 'nouns'),
    (p_user_id, '친구', 'Friend', 'chingu', 'nouns'),
    (p_user_id, '집', 'Home / House', 'jip', 'nouns'),
    (p_user_id, '오늘', 'Today', 'oneul', 'nouns'),
    (p_user_id, '내일', 'Tomorrow', 'naeil', 'nouns');
end;
$$;
