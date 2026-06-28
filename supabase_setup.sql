-- セカンドブレイン：データベースの土台（Phase 2 で本格利用）
-- Supabaseの SQL Editor に貼って Run。
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  created_at timestamptz not null default now()
);
create table if not exists prints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  image_url text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  print_id uuid references prints(id) on delete set null,
  subject text, type text, due_date date, note text,
  confidence real,
  created_at timestamptz not null default now()
);
-- 公開時は必ず RLS（自分のデータしか見えない設定）を入れること。
