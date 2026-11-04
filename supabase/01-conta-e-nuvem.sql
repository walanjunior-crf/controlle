-- Controlle v0.6 · parte 1: conta, cópia na nuvem e perfil público.
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.

-- ---------------------------------------------------------------------------
-- Cópia na nuvem: um "retrato" completo dos dados do app por pessoa.
-- Só a própria pessoa lê e escreve a sua.
create table if not exists public.backups (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  device     text,
  updated_at timestamptz not null default now()
);

alter table public.backups enable row level security;

drop policy if exists "backup: dono lê" on public.backups;
create policy "backup: dono lê" on public.backups
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "backup: dono cria" on public.backups;
create policy "backup: dono cria" on public.backups
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "backup: dono atualiza" on public.backups;
create policy "backup: dono atualiza" on public.backups
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "backup: dono apaga" on public.backups;
create policy "backup: dono apaga" on public.backups
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Perfil público: o que os amigos podem ver (nunca os hábitos).
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  handle       text unique check (handle is null or handle ~ '^[a-z0-9._]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 40),
  avatar       jsonb,
  level        int not null default 1,
  items        int not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "perfil: quem tem conta vê" on public.profiles;
create policy "perfil: quem tem conta vê" on public.profiles
  for select to authenticated using (true);

drop policy if exists "perfil: dono cria" on public.profiles;
create policy "perfil: dono cria" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "perfil: dono atualiza" on public.profiles;
create policy "perfil: dono atualiza" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- apelido: busca rápida e sem diferença de maiúsculas
create index if not exists profiles_handle_idx on public.profiles (lower(handle));
