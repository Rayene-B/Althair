create table if not exists public.althair_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default jsonb_build_object(
    'events', jsonb_build_array(),
    'tasks', jsonb_build_array(),
    'goals', jsonb_build_array(),
    'categories', jsonb_build_object(
      'Work', '#62d7ff',
      'Study', '#c7ff2e',
      'Health', '#ff5fa2',
      'Personal', '#a78bfa',
      'Finance', '#fbbf24',
      'Social', '#34d399'
    )
  ),
  updated_at timestamptz not null default now()
);

alter table public.althair_user_data enable row level security;

drop policy if exists "Users can read own Althair data" on public.althair_user_data;
drop policy if exists "Users can insert own Althair data" on public.althair_user_data;
drop policy if exists "Users can update own Althair data" on public.althair_user_data;
drop policy if exists "Users can delete own Althair data" on public.althair_user_data;

create policy "Users can read own Althair data"
on public.althair_user_data
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own Althair data"
on public.althair_user_data
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own Althair data"
on public.althair_user_data
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own Althair data"
on public.althair_user_data
for delete
to authenticated
using ((select auth.uid()) = user_id);
