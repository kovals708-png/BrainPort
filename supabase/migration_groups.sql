-- Миграция для уже развёрнутой БД: изоляция материалов по группам
-- Выполните в Supabase → SQL Editor → Run

alter table public.materials
  add column if not exists group_name text not null default '';

create index if not exists idx_materials_group on public.materials (group_name);

drop policy if exists "materials_select" on public.materials;

create policy "materials_select" on public.materials for select to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
    and (
      p.role = 'teacher'
      or (
        p.role = 'student'
        and p.group_name is not null
        and trim(p.group_name) <> ''
        and trim(p.group_name) = trim(materials.group_name)
      )
    )
  )
);
