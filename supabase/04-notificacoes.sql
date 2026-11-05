-- Controlle v0.6 · parte 4: notificações no celular (Web Push).
-- Como usar: Supabase → SQL Editor → New query → cole tudo → Run. Pode rodar de novo sem problema.
-- Depende das partes 1, 2 e 3 e da função "notify" (supabase/functions/notify) publicada.
--
-- Como funciona: quando alguém manda mensagem, faz check-in, comenta, reage ou pede
-- amizade, o banco avisa a função "notify" (pg_net). A função relê o evento no banco,
-- decide quem deve ser avisado e manda o push. Todo dia às 20h (Brasília) ela também
-- lembra quem ainda não marcou o dia num desafio.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ===========================================================================
-- Aparelhos que aceitaram notificações (um por navegador/celular).
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  remind     boolean not null default true,  -- lembrete das 20h
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push: os meus" on public.push_subscriptions;
create policy "push: os meus" on public.push_subscriptions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- O que já foi avisado (evita aviso repetido). Só a função mexe aqui.
create table if not exists public.push_log (
  key        text primary key,
  created_at timestamptz not null default now()
);
alter table public.push_log enable row level security;
revoke all on public.push_log from anon, authenticated;

-- ===========================================================================
-- Gatilho: avisa a função a cada evento. Se der erro, o evento acontece mesmo assim.
create or replace function public.push_event() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  k text;
  r jsonb := to_jsonb(new);
begin
  k := case tg_table_name
    when 'checkin_reactions' then (r ->> 'checkin_id') || ':' || (r ->> 'user_id') || ':' || (r ->> 'emoji')
    else r ->> 'id'
  end;
  begin
    perform net.http_post(
      url := 'https://irkzqtnaqqgalyognnda.supabase.co/functions/v1/notify',
      body := jsonb_build_object('table', tg_table_name, 'op', tg_op, 'key', k),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception when others then
    raise warning 'push_event: %', sqlerrm;
  end;
  return new;
end $$;

drop trigger if exists push_on_message on public.challenge_messages;
create trigger push_on_message after insert on public.challenge_messages
  for each row execute function public.push_event();

drop trigger if exists push_on_checkin on public.checkins;
create trigger push_on_checkin after insert on public.checkins
  for each row execute function public.push_event();

drop trigger if exists push_on_comment on public.checkin_comments;
create trigger push_on_comment after insert on public.checkin_comments
  for each row execute function public.push_event();

drop trigger if exists push_on_reaction on public.checkin_reactions;
create trigger push_on_reaction after insert on public.checkin_reactions
  for each row execute function public.push_event();

drop trigger if exists push_on_friend on public.friendships;
create trigger push_on_friend after insert or update of status on public.friendships
  for each row execute function public.push_event();

-- ===========================================================================
-- Lembrete diário às 20h de Brasília (23h UTC).
do $$
begin
  perform cron.unschedule('controlle-lembrete');
exception when others then null;
end $$;

select cron.schedule(
  'controlle-lembrete',
  '0 23 * * *',
  $cron$
    select net.http_post(
      url := 'https://irkzqtnaqqgalyognnda.supabase.co/functions/v1/notify',
      body := '{"table": "reminder"}'::jsonb,
      headers := '{"Content-Type": "application/json"}'::jsonb
    )
  $cron$
);

-- Faxina: o registro de avisos não precisa durar mais que 2 semanas.
do $$
begin
  perform cron.unschedule('controlle-faxina-push');
exception when others then null;
end $$;

select cron.schedule('controlle-faxina-push', '30 6 * * *', $cron$ delete from public.push_log where created_at < now() - interval '14 days' $cron$);
