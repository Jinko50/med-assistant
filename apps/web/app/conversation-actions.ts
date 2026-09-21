'use server';
import { z } from 'zod';
import { authorizedPatient } from '../lib/dal';
import { isLocale, replyText, fill, translations, type Locale } from '../lib/i18n';
import { screen } from '../../../packages/domain/safety';
import { read } from '../../../packages/domain/measurements';
import { planReply, type AttachmentOutcome } from '../../../packages/domain/reply';
import { assistantAvailable, assistantConfigured, generate } from '../lib/assistant';

// One conversation turn, in the documented order:
//
//   1. authentication and current authorization   (inside authorizedPatient)
//   2. deterministic safety screen                (packages/domain/safety.ts)
//   3. deterministic measurement reading          (packages/domain/measurements.ts)
//   4. deterministic reply plan                   (packages/domain/reply.ts)
//   5. the attachment's REAL state, re-read from the database, never taken from the client
//   6. the model, only if both gates in lib/assistant.ts are open
//   7. persistence, with the screen's decision stored for audit
//
// Steps 1-5 decide everything that matters. The model is the last and most optional step,
// and when it is absent the conversation still works: measurements are still read, files
// are still stored, and the reply says plainly what the app cannot do.
//
// Nothing here writes medical_records. Measurements become PROPOSED facts that a person
// must confirm, so ordinary conversation cannot alter confirmed medical history.

const MAX_MESSAGE_CHARS = 4000;

export interface FactView {
  id: string;
  kind: string;
  value: string;
  unit: string;
  unitStated: boolean;
  reportedWhen: string | null;
  state: 'proposed' | 'confirmed' | 'corrected' | 'declined';
  createdAt: string;
}
export interface MessageView {
  id: string;
  role: 'person' | 'assistant';
  body: string;
  createdAt: string;
  documentId: string | null;
  documentName: string | null;
  facts: FactView[];
}
export interface SendState {
  // A key into translations[locale].chatMessages, or '' on success.
  message: string;
  // The two new lines, so the conversation can grow without refetching the whole history.
  added?: MessageView[];
}

const sendInput = z.object({
  patient: z.uuid(),
  text: z.string().max(MAX_MESSAGE_CHARS),
  // The client uploads first, through the existing direct-to-Storage path, and passes the
  // reserved document id here. It is re-checked below; the client's word is not evidence.
  documentId: z.union([z.uuid(), z.literal('')]),
  // What the browser believes happened to the file. Only ever used to distinguish "tried
  // and failed" from "did not attach anything"; a claimed success is verified.
  attachment: z.enum(['none', 'stored', 'failed']),
});

function factViews(rows: Array<Record<string, unknown>> | null): FactView[] {
  return (rows ?? []).map(row => ({
    id: String(row.id),
    kind: String(row.kind),
    value: String(row.value),
    unit: String(row.unit ?? ''),
    unitStated: Boolean(row.unit_stated),
    reportedWhen: row.reported_when ? String(row.reported_when) : null,
    state: String(row.state) as FactView['state'],
    createdAt: String(row.created_at),
  }));
}

export async function sendMessage(_state: SendState, form: FormData): Promise<SendState> {
  const locale = String(form.get('locale'));
  if (!isLocale(locale)) return { message: 'sendInvalid' };
  const parsed = sendInput.safeParse({
    patient: form.get('patient'),
    text: String(form.get('text') ?? ''),
    documentId: String(form.get('documentId') ?? ''),
    attachment: String(form.get('attachment') ?? 'none'),
  });
  if (!parsed.success) return { message: 'sendInvalid' };
  const text = parsed.data.text.trim();
  if (!text && parsed.data.attachment === 'none') return { message: 'sendEmpty' };

  // The screen and the reader run before anything is written and before any model call.
  const decision = screen(text);
  const reading = read(text);

  try {
    const { db, user } = await authorizedPatient(parsed.data.patient, 'read_record');

    // The attachment's real state. A document only counts as stored when its own row says
    // so, which finishUpload sets only after re-reading the object's first bytes and size.
    let attachment: AttachmentOutcome = parsed.data.attachment === 'failed' ? 'failed' : 'none';
    let documentId: string | null = null;
    let documentName: string | null = null;
    if (parsed.data.documentId) {
      const found = await db.from('patient_documents').select('id,filename,state')
        .eq('id', parsed.data.documentId).eq('patient_id', parsed.data.patient).maybeSingle();
      if (found.data?.state === 'uploaded') {
        attachment = 'stored';
        documentId = String(found.data.id);
        documentName = String(found.data.filename);
      } else {
        // Reserved but never finished, or not this patient's. Either way the app has not
        // got the file, and must not say it has.
        attachment = 'failed';
      }
    }

    const plan = planReply({
      decision, reading, attachment,
      assistantAvailable: assistantAvailable(),
      hasText: Boolean(text),
    });

    const person = await db.from('conversation_messages').insert({
      patient_id: parsed.data.patient, author_id: user.id, role: 'person',
      locale, body: text, document_id: documentId, safety_level: decision.level,
    }).select('id,role,body,created_at,document_id').single();
    // A missing table is the pre-migration state, not a crash. It is reported as something
    // the administrator must do, and the person's text is preserved in the form.
    if (person.error) return { message: person.error.code === '42P01' ? 'sendUnprepared' : 'sendUnavailable' };

    let body = replyText(locale, plan.parts);
    // Exactly one clarification, and only about a unit the person genuinely did not write.
    if (plan.clarify) {
      body += `\n\n${fill(translations[locale].replyClarifyUnit, { value: plan.clarify.value })}`;
    }
    // The model runs last, is optional, and never replaces the deterministic lines above.
    if (plan.generate) {
      const answer = await generate({
        locale: locale as Locale, question: text,
        confirmed: await confirmedLines(db, parsed.data.patient, locale as Locale),
      });
      body = 'text' in answer
        ? [body, answer.text].filter(Boolean).join('\n\n')
        : [body, replyText(locale, [answer.error])].filter(Boolean).join('\n\n');
    }

    const assistant = await db.from('conversation_messages').insert({
      patient_id: parsed.data.patient, author_id: user.id, role: 'assistant',
      locale, body, safety_level: 'none',
    }).select('id,role,body,created_at,document_id').single();
    if (assistant.error) return { message: 'sendUnavailable' };

    // Proposed, never confirmed. Nothing a person did not review enters their history.
    let facts: FactView[] = [];
    if (plan.propose.length) {
      const inserted = await db.from('conversation_facts').insert(plan.propose.map(m => ({
        patient_id: parsed.data.patient, message_id: person.data.id, kind: m.kind,
        value: m.value, unit: m.unit, unit_stated: m.unitStated,
        reported_when: reading.time?.phrase ?? null,
        provenance: 'REPORTED', state: 'proposed', created_by: user.id,
      }))).select('id,kind,value,unit,unit_stated,reported_when,state,created_at');
      // A failure here loses the confirmation card, not the conversation. The person's
      // words and the reply are already stored; saying nothing was read would be false.
      if (!inserted.error) facts = factViews(inserted.data);
    }

    return {
      message: '',
      added: [
        { id: String(person.data.id), role: 'person', body: text, createdAt: String(person.data.created_at), documentId, documentName, facts },
        { id: String(assistant.data.id), role: 'assistant', body, createdAt: String(assistant.data.created_at), documentId: null, documentName: null, facts: [] },
      ],
    };
  } catch (error) {
    return { message: error instanceof Error && error.message === 'ACCESS_DENIED' ? 'sendDenied' : 'sendUnavailable' };
  }
}

// Confirmed measurements, formatted the way they are shown, for grounding a model answer.
// Only reviewed facts are ever sent: a proposal nobody checked is not evidence.
async function confirmedLines(db: Awaited<ReturnType<typeof authorizedPatient>>['db'], patient: string, locale: Locale) {
  const t = translations[locale];
  const rows = await db.from('conversation_facts')
    .select('kind,value,unit,reported_when,created_at,state')
    .eq('patient_id', patient).in('state', ['confirmed', 'corrected'])
    .order('created_at', { ascending: false }).limit(40);
  if (rows.error) return [];
  const labels = t.measurementKinds as Record<string, string>;
  return (rows.data ?? []).map(row =>
    `${labels[String(row.kind)] ?? row.kind}: ${row.value}${row.unit ? ` ${row.unit}` : ''}`
    + `${row.reported_when ? ` (${row.reported_when})` : ''} — ${String(row.created_at).slice(0, 10)}`);
}

const reviewInput = z.object({
  patient: z.uuid(),
  fact: z.uuid(),
  state: z.enum(['confirmed', 'corrected', 'declined']),
  value: z.string().max(40),
  unit: z.string().max(20),
});

export interface ReviewState { message: string; fact?: FactView }

// Confirm, correct or remove one proposed reading. This is the ONLY way a conversation
// fact changes, and it can happen once: a later change of mind is a new message, so the
// earlier decision stays visible instead of being overwritten.
export async function reviewFact(_state: ReviewState, form: FormData): Promise<ReviewState> {
  const locale = String(form.get('locale'));
  if (!isLocale(locale)) return { message: 'sendInvalid' };
  const parsed = reviewInput.safeParse({
    patient: form.get('patient'), fact: form.get('fact'), state: form.get('state'),
    value: String(form.get('value') ?? ''), unit: String(form.get('unit') ?? ''),
  });
  if (!parsed.success) return { message: 'sendInvalid' };
  const corrected = parsed.data.state === 'corrected';
  if (corrected && !parsed.data.value.trim()) return { message: 'sendInvalid' };
  try {
    const { db } = await authorizedPatient(parsed.data.patient, 'read_record');
    const result = await db.rpc('review_conversation_fact', {
      p_fact: parsed.data.fact,
      p_state: parsed.data.state,
      p_value: corrected ? parsed.data.value.trim() : null,
      // An empty corrected unit clears nothing: null leaves the stored unit as it was.
      p_unit: corrected && parsed.data.unit.trim() ? parsed.data.unit.trim() : null,
    });
    // 23514 is the function's own "already reviewed" refusal. It is not an error the
    // person caused, so it reads as "left as it is" rather than as a failure.
    if (result.error) return { message: result.error.code === '23514' ? 'reviewGone' : 'reviewFailed' };
    const row = await db.from('conversation_facts')
      .select('id,kind,value,unit,unit_stated,reported_when,state,created_at')
      .eq('id', parsed.data.fact).maybeSingle();
    return { message: 'reviewDone', fact: row.data ? factViews([row.data])[0] : undefined };
  } catch (error) {
    return { message: error instanceof Error && error.message === 'ACCESS_DENIED' ? 'sendDenied' : 'reviewFailed' };
  }
}

// What the chat page shows on load, and what a later conversation retrieves. Read failures
// are reported as unavailable rather than as an empty conversation: a history that silently
// looks empty would suggest the app had forgotten, which is worse than saying it cannot read.
export async function loadConversation(patientId: string, limit = 50): Promise<
  { ok: true; messages: MessageView[]; confirmed: FactView[] } | { ok: false; reason: 'denied' | 'unavailable' | 'unprepared' }> {
  try {
    const { db } = await authorizedPatient(patientId, 'read_record');
    const messages = await db.from('conversation_messages')
      .select('id,role,body,created_at,document_id')
      .eq('patient_id', patientId).order('created_at', { ascending: false }).limit(limit);
    if (messages.error) return { ok: false, reason: messages.error.code === '42P01' ? 'unprepared' : 'unavailable' };
    const rows = (messages.data ?? []).slice().reverse();
    const facts = await db.from('conversation_facts')
      .select('id,message_id,kind,value,unit,unit_stated,reported_when,state,created_at')
      .eq('patient_id', patientId).order('created_at', { ascending: true }).limit(400);
    if (facts.error) return { ok: false, reason: 'unavailable' };
    const documentIds = [...new Set(rows.map(r => r.document_id).filter(Boolean))] as string[];
    const documents = documentIds.length
      ? await db.from('patient_documents').select('id,filename').in('id', documentIds)
      : { data: [], error: null };
    const names = new Map((documents.data ?? []).map(d => [String(d.id), String(d.filename)]));
    const factRows = (facts.data ?? []) as Array<Record<string, unknown>>;
    const byMessage = new Map<string, FactView[]>();
    for (const row of factRows) {
      const key = String(row.message_id);
      byMessage.set(key, [...(byMessage.get(key) ?? []), factViews([row])[0]]);
    }
    return {
      ok: true,
      messages: rows.map(row => ({
        id: String(row.id), role: String(row.role) as MessageView['role'], body: String(row.body),
        createdAt: String(row.created_at), documentId: row.document_id ? String(row.document_id) : null,
        documentName: row.document_id ? names.get(String(row.document_id)) ?? null : null,
        facts: byMessage.get(String(row.id)) ?? [],
      })),
      confirmed: factViews(factRows).filter(fact => fact.state === 'confirmed' || fact.state === 'corrected'),
    };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable' };
  }
}

// Which provider, if any, would receive what is typed here. Shown on the screen so the
// answer does not require reading the source.
export async function assistantDisclosure(): Promise<{ on: boolean; recipient: string }> {
  const config = assistantConfigured();
  return { on: assistantAvailable(), recipient: config?.recipient ?? '' };
}
