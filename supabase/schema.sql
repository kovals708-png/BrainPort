-- BrainPort: выполните в Supabase → SQL Editor → Run

create extension if not exists "pgcrypto";

-- Профили пользователей
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role text not null check (role in ('teacher', 'student')),
  department text,
  group_name text,
  avatar text,
  created_at timestamptz not null default now()
);

-- Учебные материалы
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  type text not null default 'pdf',
  description text default '',
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  created_at date not null default current_date,
  downloads integer not null default 0,
  size text default '',
  file_path text,
  file_name text
);

-- Уведомления
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  read boolean not null default false,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_materials_author on public.materials (author_id);
create index if not exists idx_materials_subject on public.materials (subject);
create index if not exists idx_notifications_user on public.notifications (user_id);

alter table public.profiles enable row level security;
alter table public.materials enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

-- materials
create policy "materials_select" on public.materials for select to authenticated using (true);
create policy "materials_insert_teacher" on public.materials for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'teacher')
    and author_id = auth.uid()
  );
create policy "materials_update_own" on public.materials for update to authenticated using (author_id = auth.uid());
create policy "materials_delete_own" on public.materials for delete to authenticated using (author_id = auth.uid());

-- notifications
create policy "notifications_select_own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications_update_own" on public.notifications for update to authenticated using (user_id = auth.uid());
create policy "notifications_insert" on public.notifications for insert to authenticated with check (true);

-- Storage bucket (создайте в Dashboard → Storage → New bucket → name: materials, private)
insert into storage.buckets (id, name, public)
values ('materials', 'materials', false)
on conflict (id) do nothing;

create policy "materials_storage_select"
on storage.objects for select to authenticated
using (bucket_id = 'materials');

create policy "materials_storage_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'materials');

create policy "materials_storage_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'materials' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, department, group_name, avatar)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'group_name',
    coalesce(new.raw_user_meta_data->>'avatar', '??')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
