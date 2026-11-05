-- Controlle v0.6 · parte 3: desafio com check-in (foto), reações, comentários e chat.
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
-- Depende das partes 1 e 2.

-- ===========================================================================
-- Modalidade do desafio: 'auto' (os hábitos do tema contam) ou 'checkin' (post do dia).
alter table public.challenges add column if not exists mode text not null default 'auto';
alter table public.challenges add column if not exists photo_required boolean not null default false;
alter table public.challenges drop constraint if exists challenges_mode_check;
alter table public.challenges add constraint challenges_mode_check check (mode in ('auto', 'checkin'));

-- "participo deste desafio?"
create or replace function public.in_challenge(c uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.challenge_members where challenge_id = c and user_id = auth.uid())
$$;

-- ===========================================================================
-- Check-ins: um por pessoa por dia em cada desafio; foto opcional (ou obrigatória).
create table if not exists public.checkins (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day          date not null,
  photo_path   text,
  caption      text not null default '' check (char_length(caption) <= 280),
  created_at   timestamptz not null default now(),
  unique (challenge_id, user_id, day)
);
create index if not exists checkins_recent on public.checkins (challenge_id, created_at desc);

create or replace function public.checkin_challenge(k uuid) returns uuid
  language sql stable security definer set search_path = public as $$
  select challenge_id from public.checkins where id = k
$$;

alter table public.checkins enable row level security;

drop policy if exists "checkin: grupo vê" on public.checkins;
create policy "checkin: grupo vê" on public.checkins
  for select to authenticated using (public.is_member(public.challenge_group(challenge_id)));

drop policy if exists "checkin: participante posta o seu" on public.checkins;
create policy "checkin: participante posta o seu" on public.checkins
  for insert to authenticated with check (user_id = auth.uid() and public.in_challenge(challenge_id));

drop policy if exists "checkin: apagar o seu" on public.checkins;
create policy "checkin: apagar o seu" on public.checkins
  for delete to authenticated using (user_id = auth.uid());

-- reações (um de cada emoji por pessoa)
create table if not exists public.checkin_reactions (
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  emoji      text not null check (emoji in ('🔥', '💪', '👏', '😂', '❤️')),
  created_at timestamptz not null default now(),
  primary key (checkin_id, user_id, emoji)
);

alter table public.checkin_reactions enable row level security;

drop policy if exists "reação: grupo vê" on public.checkin_reactions;
create policy "reação: grupo vê" on public.checkin_reactions
  for select to authenticated using (public.is_member(public.challenge_group(public.checkin_challenge(checkin_id))));

drop policy if exists "reação: reagir" on public.checkin_reactions;
create policy "reação: reagir" on public.checkin_reactions
  for insert to authenticated with check (user_id = auth.uid() and public.is_member(public.challenge_group(public.checkin_challenge(checkin_id))));

drop policy if exists "reação: desfazer" on public.checkin_reactions;
create policy "reação: desfazer" on public.checkin_reactions
  for delete to authenticated using (user_id = auth.uid());

-- comentários
create table if not exists public.checkin_comments (
  id         bigint generated always as identity primary key,
  checkin_id uuid not null references public.checkins (id) on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists checkin_comments_by on public.checkin_comments (checkin_id, created_at);

alter table public.checkin_comments enable row level security;

drop policy if exists "comentário: grupo vê" on public.checkin_comments;
create policy "comentário: grupo vê" on public.checkin_comments
  for select to authenticated using (public.is_member(public.challenge_group(public.checkin_challenge(checkin_id))));

drop policy if exists "comentário: comentar" on public.checkin_comments;
create policy "comentário: comentar" on public.checkin_comments
  for insert to authenticated with check (user_id = auth.uid() and public.is_member(public.challenge_group(public.checkin_challenge(checkin_id))));

drop policy if exists "comentário: apagar o seu" on public.checkin_comments;
create policy "comentário: apagar o seu" on public.checkin_comments
  for delete to authenticated using (user_id = auth.uid());

-- ===========================================================================
-- Chat do desafio: quem participa lê e escreve.
create table if not exists public.challenge_messages (
  id           bigint generated always as identity primary key,
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text         text not null check (char_length(text) between 1 and 1000),
  created_at   timestamptz not null default now()
);
create index if not exists challenge_messages_recent on public.challenge_messages (challenge_id, created_at desc);

alter table public.challenge_messages enable row level security;

drop policy if exists "chat: participantes leem" on public.challenge_messages;
create policy "chat: participantes leem" on public.challenge_messages
  for select to authenticated using (public.in_challenge(challenge_id));

drop policy if exists "chat: participantes escrevem" on public.challenge_messages;
create policy "chat: participantes escrevem" on public.challenge_messages
  for insert to authenticated with check (user_id = auth.uid() and public.in_challenge(challenge_id));

drop policy if exists "chat: apagar a sua" on public.challenge_messages;
create policy "chat: apagar a sua" on public.challenge_messages
  for delete to authenticated using (user_id = auth.uid());

-- chat e check-ins chegam na hora (Realtime respeita as regras acima)
do $$
begin
  begin
    alter publication supabase_realtime add table public.challenge_messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.checkins;
  exception when duplicate_object then null;
  end;
end $$;

-- ===========================================================================
-- Fotos dos check-ins: pasta privada; caminho "desafio/pessoa/arquivo.jpg".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('checkins', 'checkins', false, 3145728, array['image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 3145728, allowed_mime_types = array['image/jpeg', 'image/webp'];

drop policy if exists "fotos: grupo vê" on storage.objects;
create policy "fotos: grupo vê" on storage.objects
  for select to authenticated using (
    bucket_id = 'checkins' and public.is_member(public.challenge_group(((storage.foldername(name))[1])::uuid))
  );

drop policy if exists "fotos: participante envia as suas" on storage.objects;
create policy "fotos: participante envia as suas" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'checkins'
    and (storage.foldername(name))[2] = auth.uid()::text
    and public.in_challenge(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "fotos: apagar as suas" on storage.objects;
create policy "fotos: apagar as suas" on storage.objects
  for delete to authenticated using (bucket_id = 'checkins' and (storage.foldername(name))[2] = auth.uid()::text);
