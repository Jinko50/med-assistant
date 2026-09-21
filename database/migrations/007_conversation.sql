-- 007: the conversation, and the reviewed memory it proposes.
--
-- REVISED 2026-09-21 after the independent review in docs/CHAT_INDEPENDENT_REVIEW.md, and
-- before ever being applied anywhere: a read-only check confirmed the live project does not
-- have these tables. The revision adds `client_token` and `post_conversation_turn`, so that
-- one turn is one transaction and a retry cannot duplicate a message. If you took a copy of
-- this file before that date, discard it and apply this one.
--
-- Additive only. It adds two tables, their policies and one review function. It does not
-- alter any existing table, function, policy, account, grant or bucket, and it never resets
-- anything. Migrations 001-006 were applied through the dashboard and are not registered in
-- CLI migration history; apply this one the same way and do not run `db push` without
-- reconciling that history first.
--
-- Two separations are the whole point of this migration:
--
--   1. A conversation line is not a medical fact. conversation_messages holds what was
--      typed and what was answered. Nothing in it is a diagnosis, a measurement of record,
--      or an instruction.
--   2. Something read out of a message is a PROPOSAL, not history. conversation_facts holds
--      what the deterministic reader believed it saw, in state 'proposed', until a person
--      confirms or corrects it. Ordinary conversation therefore cannot silently alter
--      confirmed medical history: medical_records is untouched by everything here, and a
--      proposed fact only ever becomes part of the approved record through the existing
--      reviewed path, never through this table.
begin;

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  -- Always the account that wrote the row, assistant lines included: an assistant line is
  -- composed by the server during that account's request. Recording auth.uid() keeps every
  -- line attributable. See the note on the write policy below for what this does not do.
  author_id uuid not null references auth.users(id),
  role text not null check (role in ('person', 'assistant')),
  locale text not null check (locale in ('ru', 'he', 'en')),
  -- May be empty for a person who sent only a file; see conversation_message_not_empty.
  body text not null default '' check (length(body) <= 4000),
  -- An attachment is always an already-reserved document row, so a message can never point
  -- at a file this patient does not own.
  document_id uuid references public.patient_documents(id),
  -- What the deterministic screen decided about a person's message, stored for audit.
  -- 'none' means NOTHING MATCHED, not that the text was judged safe. Assistant rows are
  -- always 'none' because the screen runs on what the person wrote.
  safety_level text not null default 'none'
    check (safety_level in ('none', 'urgent', 'medication', 'emergency')),
  -- The browser's own identifier for one turn, kept across a retry. It is what makes
  -- resending a turn that half-failed harmless: the second attempt finds the first and
  -- completes it instead of writing the person's message twice. Null is allowed and, per
  -- SQL, nulls do not collide, so rows written any other way are unaffected.
  client_token uuid,
  created_at timestamptz not null default now(),
  constraint conversation_assistant_unscreened check (role = 'person' or safety_level = 'none'),
  -- A person may send a file with nothing written; the assistant always says something.
  constraint conversation_message_not_empty check (
    length(trim(body)) > 0 or (role = 'person' and document_id is not null)),
  constraint conversation_one_turn_per_token unique (patient_id, client_token, role)
);
create index conversation_messages_recent on public.conversation_messages(patient_id, created_at desc);

-- What the deterministic reader read out of one message. Proposed until reviewed.
create table public.conversation_facts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  message_id uuid not null references public.conversation_messages(id),
  kind text not null check (kind in ('blood_pressure', 'pulse', 'temperature', 'weight', 'glucose', 'oxygen')),
  -- Exactly as written by the person, or as corrected by a person during review.
  value text not null check (length(trim(value)) between 1 and 40),
  -- May be empty: the person did not write a unit and the notation does not fix one. An
  -- empty unit is honest about what is missing; it is never filled in by guessing.
  unit text not null default '' check (length(unit) <= 20),
  -- true only when the person actually wrote the unit. false covers both a notational unit
  -- (a systolic/diastolic pair is mmHg) and an absent one.
  unit_stated boolean not null default false,
  -- The person's own words about when, e.g. 'this morning'. Never a derived calendar date;
  -- the only real timestamp on this row is created_at.
  reported_when text check (reported_when is null or length(trim(reported_when)) between 1 and 80),
  -- REPORTED is what a person says. Photographs and documents are not read by this release,
  -- so the other two values exist for the reviewed paths that will write them later.
  provenance text not null default 'REPORTED'
    check (provenance in ('REPORTED', 'SEEN IN PHOTO', 'DOCUMENTED')),
  state text not null default 'proposed'
    check (state in ('proposed', 'confirmed', 'corrected', 'declined')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  -- A reviewed row always names who reviewed it and when; an unreviewed row never pretends to.
  constraint conversation_facts_review_complete check (
    (state = 'proposed' and reviewed_by is null and reviewed_at is null)
    or (state <> 'proposed' and reviewed_by is not null and reviewed_at is not null))
);
create index conversation_facts_recent on public.conversation_facts(patient_id, created_at desc);
create index conversation_facts_by_message on public.conversation_facts(message_id);

alter table public.conversation_messages enable row level security;
alter table public.conversation_facts enable row level security;
revoke all on public.conversation_messages, public.conversation_facts from anon, authenticated;
grant select, insert on public.conversation_messages to authenticated;
grant select, insert on public.conversation_facts to authenticated;

-- Everyone with current access to the record reads the conversation. Revocation applies
-- immediately, because has_access is evaluated per statement against live membership.
create policy conversation_read on public.conversation_messages for select to authenticated
  using (private.has_access(patient_id));
create policy conversation_facts_read on public.conversation_facts for select to authenticated
  using (private.has_access(patient_id));

-- Writing requires current access AND attribution to the writer. read_record is deliberate:
-- a patient with read-only access may talk about their own day and report their own
-- measurements. It does not let them write medical_records, which has no insert grant at all.
--
-- Honest limit: this policy cannot stop a member of this family from inserting a row with
-- role='assistant' using their own credentials. That is not a privilege boundary - they
-- already read and write this record - and the row still carries their user id, so a
-- fabricated line is attributable rather than anonymous.
create policy conversation_write on public.conversation_messages for insert to authenticated
  with check (private.has_access(patient_id) and author_id = auth.uid());
create policy conversation_facts_write on public.conversation_facts for insert to authenticated
  with check (private.has_access(patient_id) and created_by = auth.uid()
    and state = 'proposed' and reviewed_by is null and reviewed_at is null);

-- No update or delete grant on either table. A conversation line is what was said at the
-- time. The single permitted change is a review of a proposed fact, which goes through the
-- function below so that only the review columns can move, and only once.
create function public.review_conversation_fact(
  p_fact uuid, p_state text, p_value text default null, p_unit text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare fact public.conversation_facts;
begin
  if p_state not in ('confirmed', 'corrected', 'declined') then
    raise exception 'Unsupported review state' using errcode = '22023';
  end if;
  select * into fact from public.conversation_facts where id = p_fact for update;
  if not found or not private.has_access(fact.patient_id) then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  -- Only a proposal can be reviewed. A change of mind afterwards is a new message, so the
  -- earlier review stays visible instead of being overwritten.
  if fact.state <> 'proposed' then
    raise exception 'Already reviewed' using errcode = '23514';
  end if;
  update public.conversation_facts set
    state = p_state,
    value = case when p_state = 'corrected' and p_value is not null then p_value else value end,
    unit = case when p_state = 'corrected' and p_unit is not null then p_unit else unit end,
    -- A corrected value is one a person typed, so the unit is then stated by a person.
    unit_stated = case when p_state = 'corrected' and p_unit is not null then true else unit_stated end,
    reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_fact;
  insert into public.audit_events(patient_id, actor_id, event_type)
    values (fact.patient_id, auth.uid(), 'conversation.fact.' || p_state);
end; $$;
revoke all on function public.review_conversation_fact(uuid, text, text, text) from public, anon;
grant execute on function public.review_conversation_fact(uuid, text, text, text) to authenticated;

-- One turn is one transaction.
--
-- A turn is three writes: what the person said, what the assistant answered, and the
-- readings proposed from it. Performed separately they can half-succeed — the person's
-- message stored, the reply lost — and a retry then stores the message twice while the
-- failed fact insert disappears silently. Here they commit together or not at all, and the
-- browser's own token makes a retry idempotent: a second attempt with the same token
-- completes whatever is missing and returns the same rows.
--
-- The whole turn is composed before this is called: the safety screen, the measurement
-- reader, the reply plan and any model answer have all already run. Nothing is decided here.
create function public.post_conversation_turn(
  p_patient uuid, p_locale text, p_token uuid,
  p_body text, p_document uuid, p_safety text,
  p_reply text, p_facts jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare person_id uuid; assistant_id uuid;
begin
  if p_token is null then raise exception 'A turn needs a token' using errcode = '22023'; end if;
  -- read_record is deliberate: a patient with read-only access may talk about their own day.
  if not private.has_access(p_patient) then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  select id into person_id from public.conversation_messages
    where patient_id = p_patient and client_token = p_token and role = 'person';
  if person_id is null then
    insert into public.conversation_messages(
      patient_id, author_id, role, locale, body, document_id, safety_level, client_token)
    values (p_patient, auth.uid(), 'person', p_locale, coalesce(p_body, ''),
            p_document, coalesce(p_safety, 'none'), p_token)
    returning id into person_id;
    -- Proposed, always. A fact that cannot be stored aborts the turn rather than vanishing.
    insert into public.conversation_facts(
      patient_id, message_id, kind, value, unit, unit_stated, reported_when,
      provenance, state, created_by)
    select p_patient, person_id, fact->>'kind', fact->>'value',
           coalesce(fact->>'unit', ''), coalesce((fact->>'unit_stated')::boolean, false),
           nullif(fact->>'reported_when', ''), 'REPORTED', 'proposed', auth.uid()
    from jsonb_array_elements(coalesce(p_facts, '[]'::jsonb)) fact;
  end if;

  select id into assistant_id from public.conversation_messages
    where patient_id = p_patient and client_token = p_token and role = 'assistant';
  if assistant_id is null then
    insert into public.conversation_messages(
      patient_id, author_id, role, locale, body, safety_level, client_token)
    values (p_patient, auth.uid(), 'assistant', p_locale, p_reply, 'none', p_token)
    returning id into assistant_id;
  end if;

  return jsonb_build_object(
    'person', (select to_jsonb(m) from public.conversation_messages m where m.id = person_id),
    'assistant', (select to_jsonb(m) from public.conversation_messages m where m.id = assistant_id),
    'facts', coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at)
      from public.conversation_facts f where f.message_id = person_id), '[]'::jsonb));
end; $$;
revoke all on function public.post_conversation_turn(uuid, text, uuid, text, uuid, text, text, jsonb) from public, anon;
grant execute on function public.post_conversation_turn(uuid, text, uuid, text, uuid, text, text, jsonb) to authenticated;

insert into public.schema_versions(version) values (7);

commit;
