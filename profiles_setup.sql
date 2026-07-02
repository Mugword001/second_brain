-- 診断結果をしまう棚。Supabaseの SQL Editor に貼って Run。
create table if not exists profiles (
  id         uuid primary key default gen_random_uuid(),
  nickname   text,            -- 診断の二つ名（例：音楽を愛する歴史家）
  answers    jsonb,           -- 各ジャンルの好き度・詳しさ
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;
create policy "anyone can read profiles" on profiles for select using (true);
create policy "anyone can insert profiles" on profiles for insert with check (true);
