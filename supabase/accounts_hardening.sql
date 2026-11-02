-- 계정 보안 다지기 (2026-11-02), accounts.sql 위에 한 번만 적용
-- 1) 비밀번호 해시를 더 단단하게(bcrypt 10). 기존 해시는 다음 로그인 때 저절로 바뀜
-- 2) 틀린 횟수가 쌓이면 잠금 시간이 늘어남: 5분 → 10분 → 20분 ... 최대 하루
-- 3) 토큰은 원문 대신 sha256 해시로만 저장(표가 새어도 토큰을 쓸 수 없게)
-- 4) 새로 만드는 비밀번호는 6자 이상
-- 5) "없는 아이디"와 "틀린 비밀번호"를 같은 답으로(아이디가 있는지 떠보지 못하게)

alter table public.accounts add column if not exists lockouts int not null default 0;

-- 이미 저장된 토큰을 해시로 바꿈(한 번만). 원문 토큰(36자 hex)만 골라 바꾸므로 두 번 돌려도 안전
update public.accounts set tokens = array(
  select case when char_length(t) = 36 then encode(extensions.digest(t, 'sha256'), 'hex') else t end
  from unnest(tokens) t);

create or replace function public.account_tok(p_token text)
returns text language sql immutable set search_path = '' as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
$$;
revoke all on function public.account_tok(text) from public, anon, authenticated;

create or replace function public.account_signup(p_id text, p_pass text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text := lower(btrim(p_id)); v_tok text := encode(extensions.gen_random_bytes(18), 'hex');
begin
  if char_length(v_id) < 2 or char_length(v_id) > 16 then return jsonb_build_object('error', 'id'); end if;
  if char_length(coalesce(p_pass, '')) < 6 or char_length(p_pass) > 72 then return jsonb_build_object('error', 'pass'); end if;
  if pg_column_size(p_data) > 200000 then return jsonb_build_object('error', 'size'); end if;
  insert into public.accounts (id, pass_hash, tokens, data)
  values (v_id, extensions.crypt(p_pass, extensions.gen_salt('bf', 10)), array[public.account_tok(v_tok)], coalesce(p_data, '{}'::jsonb))
  on conflict (id) do nothing;
  if not found then return jsonb_build_object('error', 'taken'); end if;
  return jsonb_build_object('token', v_tok, 'data', p_data, 'updated_at', now());
end $$;

create or replace function public.account_login(p_id text, p_pass text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id text := lower(btrim(p_id)); r public.accounts; v_tok text := encode(extensions.gen_random_bytes(18), 'hex');
begin
  select * into r from public.accounts where id = v_id for update;
  if not found then
    perform extensions.crypt(coalesce(p_pass, ''), extensions.gen_salt('bf', 10)); -- 걸리는 시간도 같게
    return jsonb_build_object('error', 'wrong');
  end if;
  if r.locked_until is not null and r.locked_until > now() then return jsonb_build_object('error', 'locked'); end if;
  if r.pass_hash <> extensions.crypt(coalesce(p_pass, ''), r.pass_hash) then
    update public.accounts set
      locked_until = case when fails + 1 >= 5 then now() + least(interval '5 minutes' * power(2, lockouts), interval '1 day') else null end,
      lockouts = case when fails + 1 >= 5 then least(lockouts + 1, 20) else lockouts end,
      fails = case when fails + 1 >= 5 then 0 else fails + 1 end
    where id = v_id;
    return jsonb_build_object('error', 'wrong');
  end if;
  update public.accounts set fails = 0, lockouts = 0, locked_until = null,
    pass_hash = case when r.pass_hash like '$2a$10$%' then r.pass_hash else extensions.crypt(p_pass, extensions.gen_salt('bf', 10)) end,
    tokens = (array[public.account_tok(v_tok)] || tokens)[1:10]
  where id = v_id;
  return jsonb_build_object('token', v_tok, 'data', r.data, 'updated_at', r.updated_at);
end $$;

create or replace function public.account_load(p_id text, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.accounts;
begin
  select * into r from public.accounts where id = lower(btrim(p_id)) and public.account_tok(p_token) = any(tokens);
  if not found then return jsonb_build_object('error', 'token'); end if;
  return jsonb_build_object('data', r.data, 'updated_at', r.updated_at);
end $$;

create or replace function public.account_save(p_id text, p_token text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if pg_column_size(p_data) > 200000 then return jsonb_build_object('error', 'size'); end if;
  update public.accounts set data = p_data, updated_at = now() where id = lower(btrim(p_id)) and public.account_tok(p_token) = any(tokens);
  if not found then return jsonb_build_object('error', 'token'); end if;
  return jsonb_build_object('ok', true, 'updated_at', now());
end $$;

create or replace function public.account_logout(p_id text, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  update public.accounts set tokens = array_remove(tokens, public.account_tok(p_token)) where id = lower(btrim(p_id));
  return jsonb_build_object('ok', true);
end $$;
