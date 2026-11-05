-- Controlle v0.6 · parte 2: amigos, grupos, desafios e mural.
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
-- Depende da parte 1 (01-conta-e-nuvem.sql).

-- ===========================================================================
-- Amigos: um pedido por par de pessoas; quem recebe aceita.
create table if not exists public.friendships (
  id         uuid primary key default gen_random_uuid(),
  requester  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  addressee  uuid not null references auth.users (id) on delete cascade,
  status     text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);
create unique index if not exists friendships_pair
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

alter table public.friendships enable row level security;

drop policy if exists "amizade: os dois veem" on public.friendships;
create policy "amizade: os dois veem" on public.friendships
  for select to authenticated using (auth.uid() in (requester, addressee));

drop policy if exists "amizade: pedir" on public.friendships;
create policy "amizade: pedir" on public.friendships
  for insert to authenticated with check (requester = auth.uid() and status = 'pending');

drop policy if exists "amizade: aceitar" on public.friendships;
create policy "amizade: aceitar" on public.friendships
  for update to authenticated using (addressee = auth.uid()) with check (addressee = auth.uid() and status = 'accepted');

drop policy if exists "amizade: desfazer" on public.friendships;
create policy "amizade: desfazer" on public.friendships
  for delete to authenticated using (auth.uid() in (requester, addressee));

-- ===========================================================================
-- Grupos: até 20 pessoas; entra-se pelo código de convite.
create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  emoji       text not null default '🌱' check (char_length(emoji) <= 16),
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  invite_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  created_at  timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- "sou membro?" sem cair em recursão nas regras
create or replace function public.is_member(g uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members where group_id = g and user_id = auth.uid())
$$;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;

drop policy if exists "grupo: membros veem" on public.groups;
create policy "grupo: membros veem" on public.groups
  for select to authenticated using (public.is_member(id) or owner = auth.uid());

drop policy if exists "grupo: criar" on public.groups;
create policy "grupo: criar" on public.groups
  for insert to authenticated with check (owner = auth.uid());

drop policy if exists "grupo: dono edita" on public.groups;
create policy "grupo: dono edita" on public.groups
  for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

drop policy if exists "grupo: dono apaga" on public.groups;
create policy "grupo: dono apaga" on public.groups
  for delete to authenticated using (owner = auth.uid());

drop policy if exists "membros: membros veem" on public.group_members;
create policy "membros: membros veem" on public.group_members
  for select to authenticated using (public.is_member(group_id));

drop policy if exists "membros: sair ou dono remove" on public.group_members;
create policy "membros: sair ou dono remove" on public.group_members
  for delete to authenticated using (
    user_id = auth.uid() or exists (select 1 from public.groups g where g.id = group_id and g.owner = auth.uid())
  );

-- quem cria o grupo entra nele
create or replace function public.add_owner_as_member() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.owner) on conflict do nothing;
  return new;
end $$;
drop trigger if exists groups_add_owner on public.groups;
create trigger groups_add_owner after insert on public.groups
  for each row execute function public.add_owner_as_member();

-- prévia do convite (nome, emoji, quantos) para quem ainda não é membro
create or replace function public.group_preview(code text)
  returns table (id uuid, name text, emoji text, members int)
  language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.emoji, (select count(*)::int from public.group_members m where m.group_id = g.id)
  from public.groups g where g.invite_code = lower(code)
$$;

-- entrar pelo código (máximo de 20 pessoas)
create or replace function public.join_group(code text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare gid uuid; n int;
begin
  if auth.uid() is null then raise exception 'precisa entrar na conta'; end if;
  select id into gid from public.groups where invite_code = lower(code);
  if gid is null then raise exception 'convite inválido'; end if;
  select count(*) into n from public.group_members where group_id = gid;
  if n >= 20 and not public.is_member(gid) then raise exception 'grupo cheio'; end if;
  insert into public.group_members (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end $$;

-- ===========================================================================
-- Desafios: um tema de hábito, por N dias, dentro de um grupo.
create table if not exists public.challenges (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  category   text not null,
  title      text not null check (char_length(title) between 1 and 60),
  start_day  date not null,
  days       int not null check (days between 3 and 60),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.challenges enable row level security;

drop policy if exists "desafio: membros veem" on public.challenges;
create policy "desafio: membros veem" on public.challenges
  for select to authenticated using (public.is_member(group_id));

drop policy if exists "desafio: membro cria" on public.challenges;
create policy "desafio: membro cria" on public.challenges
  for insert to authenticated with check (public.is_member(group_id) and created_by = auth.uid());

drop policy if exists "desafio: quem criou apaga" on public.challenges;
create policy "desafio: quem criou apaga" on public.challenges
  for delete to authenticated using (created_by = auth.uid());

-- quem entrou no desafio e em quais dias cumpriu (o app de cada um envia os seus)
create table if not exists public.challenge_members (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  done_days    date[] not null default '{}',
  updated_at   timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create or replace function public.challenge_group(c uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select group_id from public.challenges where id = c
$$;

alter table public.challenge_members enable row level security;

drop policy if exists "placar: membros do grupo veem" on public.challenge_members;
create policy "placar: membros do grupo veem" on public.challenge_members
  for select to authenticated using (public.is_member(public.challenge_group(challenge_id)));

drop policy if exists "placar: entrar" on public.challenge_members;
create policy "placar: entrar" on public.challenge_members
  for insert to authenticated with check (user_id = auth.uid() and public.is_member(public.challenge_group(challenge_id)));

drop policy if exists "placar: atualizar o seu" on public.challenge_members;
create policy "placar: atualizar o seu" on public.challenge_members
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "placar: sair" on public.challenge_members;
create policy "placar: sair" on public.challenge_members
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- Mural do grupo: acontecimentos curtos e aplausos.
create table if not exists public.group_activity (
  id         bigint generated always as identity primary key,
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('join', 'challenge_new', 'challenge_join', 'challenge_done', 'perfect_day', 'item')),
  text       text not null check (char_length(text) <= 140),
  created_at timestamptz not null default now()
);
create index if not exists group_activity_recent on public.group_activity (group_id, created_at desc);

alter table public.group_activity enable row level security;

drop policy if exists "mural: membros veem" on public.group_activity;
create policy "mural: membros veem" on public.group_activity
  for select to authenticated using (public.is_member(group_id));

drop policy if exists "mural: membro publica o seu" on public.group_activity;
create policy "mural: membro publica o seu" on public.group_activity
  for insert to authenticated with check (user_id = auth.uid() and public.is_member(group_id));

drop policy if exists "mural: apagar o seu" on public.group_activity;
create policy "mural: apagar o seu" on public.group_activity
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.activity_cheers (
  activity_id bigint not null references public.group_activity (id) on delete cascade,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create or replace function public.activity_group(a bigint) returns uuid
  language sql stable security definer set search_path = public as $$
  select group_id from public.group_activity where id = a
$$;

alter table public.activity_cheers enable row level security;

drop policy if exists "aplausos: membros veem" on public.activity_cheers;
create policy "aplausos: membros veem" on public.activity_cheers
  for select to authenticated using (public.is_member(public.activity_group(activity_id)));

drop policy if exists "aplausos: aplaudir" on public.activity_cheers;
create policy "aplausos: aplaudir" on public.activity_cheers
  for insert to authenticated with check (user_id = auth.uid() and public.is_member(public.activity_group(activity_id)));

drop policy if exists "aplausos: desfazer" on public.activity_cheers;
create policy "aplausos: desfazer" on public.activity_cheers
  for delete to authenticated using (user_id = auth.uid());

-- funções chamáveis pelo app (só quem tem conta)
revoke all on function public.join_group(text) from public, anon;
grant execute on function public.join_group(text) to authenticated;
revoke all on function public.group_preview(text) from public, anon;
grant execute on function public.group_preview(text) to authenticated;
