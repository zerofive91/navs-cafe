-- 기기가 달라도 이어 하기 (2026-11): 아이디 + 비밀번호 계정
-- ※ 2026-11-02 보안 다지기는 accounts_hardening.sql (이 파일 다음에 적용)
-- 표는 직접 읽고 쓸 수 없고(RLS, 정책 없음), 아래 함수로만 다룸. 비밀번호는 bcrypt로만 저장
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.accounts (
  id text primary key check (char_length(id) between 2 and 16),
  pass_hash text not null,
  tokens text[] not null default '{}',
  data jsonb not null default '{}'::jsonb,
  fails int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.accounts enable row level security;
revoke all on public.accounts from anon, authenticated;

-- 새로 만들기: 아이디가 비어 있으면 만들고 토큰을 돌려줌
create or replace function public.account_signup(p_id text, p_pass text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text := lower(btrim(p_id)); v_tok text := encode(extensions.gen_random_bytes(18), 'hex');
begin
  if char_length(v_id) < 2 or char_length(v_id) > 16 then return jsonb_build_object('error', 'id'); end if;
  if char_length(coalesce(p_pass, '')) < 4 then return jsonb_build_object('error', 'pass'); end if;
  if pg_column_size(p_data) > 200000 then return jsonb_build_object('error', 'size'); end if;
  insert into public.accounts (id, pass_hash, tokens, data)
  values (v_id, extensions.crypt(p_pass, extensions.gen_salt('bf')), array[v_tok], coalesce(p_data, '{}'::jsonb))
  on conflict (id) do nothing;
  if not found then return jsonb_build_object('error', 'taken'); end if;
  return jsonb_build_object('token', v_tok, 'data', p_data, 'updated_at', now());
end $$;

-- 들어오기: 비밀번호가 맞으면 새 토큰과 저장된 것을 돌려줌. 다섯 번 틀리면 5분 잠금
create or replace function public.account_login(p_id text, p_pass text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text := lower(btrim(p_id)); r public.accounts; v_tok text := encode(extensions.gen_random_bytes(18), 'hex');
begin
  select * into r from public.accounts where id = v_id for update;
  if not found then return jsonb_build_object('error', 'nouser'); end if;
  if r.locked_until is not null and r.locked_until > now() then return jsonb_build_object('error', 'locked'); end if;
  if r.pass_hash <> extensions.crypt(p_pass, r.pass_hash) then
    update public.accounts set
      locked_until = case when fails + 1 >= 5 then now() + interval '5 minutes' else null end,
      fails = case when fails + 1 >= 5 then 0 else fails + 1 end
    where id = v_id;
    return jsonb_build_object('error', 'wrong');
  end if;
  update public.accounts set fails = 0, locked_until = null, tokens = (array[v_tok] || tokens)[1:10] where id = v_id;
  return jsonb_build_object('token', v_tok, 'data', r.data, 'updated_at', r.updated_at);
end $$;

-- 불러오기·저장하기: 들어올 때 받은 토큰으로
create or replace function public.account_load(p_id text, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.accounts;
begin
  select * into r from public.accounts where id = lower(btrim(p_id)) and p_token = any(tokens);
  if not found then return jsonb_build_object('error', 'token'); end if;
  return jsonb_build_object('data', r.data, 'updated_at', r.updated_at);
end $$;

create or replace function public.account_save(p_id text, p_token text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if pg_column_size(p_data) > 200000 then return jsonb_build_object('error', 'size'); end if;
  update public.accounts set data = p_data, updated_at = now() where id = lower(btrim(p_id)) and p_token = any(tokens);
  if not found then return jsonb_build_object('error', 'token'); end if;
  return jsonb_build_object('ok', true, 'updated_at', now());
end $$;

create or replace function public.account_logout(p_id text, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  update public.accounts set tokens = array_remove(tokens, p_token) where id = lower(btrim(p_id));
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.account_signup(text, text, jsonb), public.account_login(text, text),
  public.account_load(text, text), public.account_save(text, text, jsonb), public.account_logout(text, text) from public;
grant execute on function public.account_signup(text, text, jsonb), public.account_login(text, text),
  public.account_load(text, text), public.account_save(text, text, jsonb), public.account_logout(text, text) to anon, authenticated;
