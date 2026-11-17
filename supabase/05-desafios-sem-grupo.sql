-- Controlle v0.7 · desafios sem grupo (estilo Gym Rats).
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
-- Depende das partes 1 a 4.
--
-- O que muda:
--   • o desafio existe sozinho: tem nome, emoji, convite próprio e só quem participa vê;
--   • quem cria escolhe a pontuação: 1 ponto por dia ativo ou 1 ponto por check-in;
--   • dá para postar vários check-ins no mesmo dia;
--   • os grupos ficam guardados, mas o app não usa mais.

-- ===========================================================================
-- Desafio independente
alter table public.challenges alter column group_id drop not null;
alter table public.challenges alter column category drop not null;
alter table public.challenges add column if not exists emoji text not null default '🏁';
alter table public.challenges add column if not exists scoring text not null default 'days';
alter table public.challenges add column if not exists invite_code text;

alter table public.challenges drop constraint if exists challenges_scoring_check;
alter table public.challenges add constraint challenges_scoring_check check (scoring in ('days', 'checkins'));
alter table public.challenges drop constraint if exists challenges_days_check;
alter table public.challenges add constraint challenges_days_check check (days between 1 and 365);
alter table public.challenges drop constraint if exists challenges_emoji_check;
alter table public.challenges add constraint challenges_emoji_check check (char_length(emoji) between 1 and 16);

-- convite de 8 letras/números (os antigos ganham um agora)
alter table public.challenges alter column invite_code set default lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
update public.challenges set invite_code = lower(substr(md5(random()::text || id::text), 1, 8)) where invite_code is null;
alter table public.challenges alter column invite_code set not null;
create unique index if not exists challenges_invite_code on public.challenges (invite_code);

-- quem cria já entra
create or replace function public.challenge_add_creator() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.challenge_members (challenge_id, user_id) values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists challenge_add_creator on public.challenges;
create trigger challenge_add_creator after insert on public.challenges
  for each row execute function public.challenge_add_creator();

-- regras: só participantes (e quem criou) veem
drop policy if exists "desafio: membros veem" on public.challenges;
drop policy if exists "desafio: membro cria" on public.challenges;
drop policy if exists "desafio: quem criou apaga" on public.challenges;
drop policy if exists "desafio: participantes veem" on public.challenges;
drop policy if exists "desafio: criar" on public.challenges;
drop policy if exists "desafio: quem criou edita" on public.challenges;

create policy "desafio: participantes veem" on public.challenges
  for select to authenticated using (created_by = auth.uid() or public.in_challenge(id));
create policy "desafio: criar" on public.challenges
  for insert to authenticated with check (created_by = auth.uid() and group_id is null);
create policy "desafio: quem criou edita" on public.challenges
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "desafio: quem criou apaga" on public.challenges
  for delete to authenticated using (created_by = auth.uid());

grant select, insert, update, delete on public.challenges to authenticated;

-- participantes: entra-se pelo convite (função abaixo), não direto na tabela
drop policy if exists "placar: membros do grupo veem" on public.challenge_members;
drop policy if exists "placar: entrar" on public.challenge_members;
drop policy if exists "placar: participantes veem" on public.challenge_members;

create policy "placar: participantes veem" on public.challenge_members
  for select to authenticated using (public.in_challenge(challenge_id));

-- ===========================================================================
-- Convite: ver antes de entrar, e entrar
create or replace function public.challenge_preview(code text)
  returns table (id uuid, title text, emoji text, start_day date, days int, scoring text, photo_required boolean, members int, creator text)
  language sql stable security definer set search_path = public as $$
  select c.id, c.title, c.emoji, c.start_day, c.days, c.scoring, c.photo_required,
         (select count(*)::int from public.challenge_members m where m.challenge_id = c.id),
         coalesce(p.display_name, 'Alguém')
  from public.challenges c
  left join public.profiles p on p.id = c.created_by
  where c.invite_code = lower(trim(code))
$$;

create or replace function public.join_challenge(code text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare
  c uuid;
  n int;
begin
  if auth.uid() is null then
    raise exception 'entre na sua conta';
  end if;
  select id into c from public.challenges where invite_code = lower(trim(code));
  if c is null then
    raise exception 'convite inválido';
  end if;
  select count(*) into n from public.challenge_members where challenge_id = c;
  if n >= 100 and not exists (select 1 from public.challenge_members where challenge_id = c and user_id = auth.uid()) then
    raise exception 'desafio cheio';
  end if;
  insert into public.challenge_members (challenge_id, user_id) values (c, auth.uid()) on conflict do nothing;
  return c;
end $$;

revoke all on function public.challenge_preview(text) from public, anon;
revoke all on function public.join_challenge(text) from public, anon;
grant execute on function public.challenge_preview(text) to authenticated;
grant execute on function public.join_challenge(text) to authenticated;

-- ===========================================================================
-- Check-ins: vários por dia; o automático (vindo de um hábito) é um por dia
alter table public.checkins drop constraint if exists checkins_challenge_id_user_id_day_key;
alter table public.checkins add column if not exists auto boolean not null default false;
create unique index if not exists checkins_auto_once on public.checkins (challenge_id, user_id, day) where auto;
create index if not exists checkins_by_member on public.checkins (challenge_id, user_id, day);

drop policy if exists "checkin: grupo vê" on public.checkins;
drop policy if exists "checkin: participantes veem" on public.checkins;
create policy "checkin: participantes veem" on public.checkins
  for select to authenticated using (public.in_challenge(challenge_id));

drop policy if exists "reação: grupo vê" on public.checkin_reactions;
drop policy if exists "reação: participantes veem" on public.checkin_reactions;
create policy "reação: participantes veem" on public.checkin_reactions
  for select to authenticated using (public.in_challenge(public.checkin_challenge(checkin_id)));

drop policy if exists "reação: reagir" on public.checkin_reactions;
create policy "reação: reagir" on public.checkin_reactions
  for insert to authenticated with check (user_id = auth.uid() and public.in_challenge(public.checkin_challenge(checkin_id)));

drop policy if exists "comentário: grupo vê" on public.checkin_comments;
drop policy if exists "comentário: participantes veem" on public.checkin_comments;
create policy "comentário: participantes veem" on public.checkin_comments
  for select to authenticated using (public.in_challenge(public.checkin_challenge(checkin_id)));

drop policy if exists "comentário: comentar" on public.checkin_comments;
create policy "comentário: comentar" on public.checkin_comments
  for insert to authenticated with check (user_id = auth.uid() and public.in_challenge(public.checkin_challenge(checkin_id)));

-- fotos: só participantes veem
drop policy if exists "fotos: grupo vê" on storage.objects;
drop policy if exists "fotos: participantes veem" on storage.objects;
create policy "fotos: participantes veem" on storage.objects
  for select to authenticated using (
    bucket_id = 'checkins' and public.in_challenge(((storage.foldername(name))[1])::uuid)
  );
