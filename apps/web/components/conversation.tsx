'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import { beginUpload, finishUpload } from '../app/document-actions';
import { sendMessage, reviewFact, type MessageView, type FactView } from '../app/conversation-actions';
import { translations, actionMessage, measurementLabel, formatTimestamp, direction, type Locale } from '../lib/i18n';
import { uploadRejection, HEADER_SAMPLE_BYTES } from '../../../packages/domain/document';
import { turn, emptyTurn, uploadStep, canSend, type TurnState } from '../../../packages/domain/turn';

// The whole product, on one screen: a conversation, a box to write in, one button to
// attach something, and Send.
//
// The behaviour that matters is in packages/domain/turn.ts, as a pure state machine, so it
// can be tested rather than asserted about. This file is the wiring: it performs the network
// steps the machine asks for and reports each outcome back to it.
//
// Three behaviours here are safety requirements rather than polish:
//
//   * "Uploaded" and "read" are different words and different states. The progress line
//     says which one has actually happened, and the app never claims to have read a file
//     whose contents it has not opened.
//   * A failure never eats the message. The text stays in the box, the chosen file stays
//     attached, and Retry resumes from where it stopped - a file whose bytes already reached
//     Storage is verified, not uploaded again. The turn keeps its token, so the server
//     recognises the retry instead of storing the message twice.
//   * A reading the app believes it found is shown as a small confirmation with Confirm and
//     Correct, and stays PROPOSED until someone answers. Ordinary talk produces no card at
//     all, so the conversation does not turn into a form.

function toBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// Every browser this runs in has crypto.randomUUID; the fallback exists so that a missing
// secure context degrades to a still-unique token rather than to a crash.
function newToken() {
  try { return crypto.randomUUID(); } catch { /* fall through */ }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// One proposed reading. Compact by design: two lines and two buttons, not a form.
function FactCard({ fact, patient, locale }: { fact: FactView; patient: string; locale: Locale }) {
  const t = translations[locale];
  const [current, setCurrent] = useState(fact);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(fact.value);
  const [unit, setUnit] = useState(fact.unit);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function submit(state: 'confirmed' | 'corrected' | 'declined') {
    setBusy(true);
    const form = new FormData();
    form.set('locale', locale); form.set('patient', patient); form.set('fact', current.id);
    form.set('state', state); form.set('value', value); form.set('unit', unit);
    try {
      const result = await reviewFact({ message: '' }, form);
      if (result.fact) setCurrent(result.fact);
      setNote(result.message === 'reviewDone' ? '' : result.message);
      if (result.message === 'reviewDone' || result.fact) setEditing(false);
    } catch {
      // A dropped connection must not leave the card permanently disabled, and must not
      // pretend the review was saved.
      setNote('reviewFailed');
    } finally {
      setBusy(false);
    }
  }

  const reviewed = current.state !== 'proposed';
  const stateLabel = { proposed: t.confirmPending, confirmed: t.confirmConfirmed, corrected: t.confirmCorrected, declined: t.confirmDeclined }[current.state];

  return <div className="fact-card">
    <p className="fact-line">
      <strong>{measurementLabel(locale, current.kind)}:</strong>{' '}
      <span dir="ltr">{current.value}{current.unit ? ` ${current.unit}` : ''}</span>
      {current.reportedWhen ? ` · ${current.reportedWhen}` : ` · ${t.whenMissing}`}
    </p>
    <p className="tiny">
      {/* Says where the unit came from, so a unit the app supplied is never mistaken for one
          the person wrote. */}
      {!current.unit ? t.unitMissing : current.unitStated ? '' : t.unitSupplied}
      {!current.unit || !current.unitStated ? ' · ' : ''}{stateLabel}
    </p>
    {editing && <div className="fact-edit">
      <label>{t.confirmValue}<input value={value} dir="ltr" maxLength={40} onChange={e => setValue(e.target.value)}/></label>
      <label>{t.confirmUnit}<input value={unit} dir="ltr" maxLength={20} onChange={e => setUnit(e.target.value)}/></label>
      <button className="button primary" type="button" disabled={busy || !value.trim()} onClick={() => submit('corrected')}>{t.confirmSave}</button>
      <button className="button secondary" type="button" disabled={busy} onClick={() => setEditing(false)}>{t.confirmCancel}</button>
      <button className="text-link" type="button" disabled={busy} onClick={() => submit('declined')}>{t.confirmNotMeasurement}</button>
    </div>}
    {!editing && !reviewed && <div className="fact-actions">
      <button className="button primary" type="button" disabled={busy} onClick={() => submit('confirmed')}>{t.confirmAccept}</button>
      <button className="button secondary" type="button" disabled={busy} onClick={() => setEditing(true)}>{t.confirmCorrect}</button>
    </div>}
    {note && <p role="status" className="tiny">{actionMessage(locale, 'chatMessages', note)}</p>}
  </div>;
}

export function Conversation({ patient, locale, initial, unprepared = false }: {
  patient: string; locale: Locale; initial: MessageView[]; unprepared?: boolean;
}) {
  const t = translations[locale];
  const [messages, setMessages] = useState<MessageView[]>(initial);
  const [draft, dispatch] = useReducer(turn, '', () => emptyTurn(''));
  const file = useRef<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // The first token is minted in the browser, after hydration, so the server and client
  // render the same markup.
  useEffect(() => { if (!draft.token) dispatch({ type: 'sent', token: newToken() }); }, [draft.token]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages.length, draft.phase]);

  // Performs whatever stage of the upload is still outstanding and returns the verified
  // document id, or '' when there is no attachment. Throws a translation key on failure.
  async function uploadIfNeeded(state: TurnState): Promise<string> {
    const step = uploadStep(state);
    if (step === 'none') return state.storedId;
    const chosen = file.current;
    if (!chosen) throw new Error('chooseFile');

    let documentId = state.pendingId;
    if (step === 'begin') {
      const rejection = uploadRejection(chosen.size);
      if (rejection) throw new Error(rejection);
      const buffer = new Uint8Array(await chosen.arrayBuffer());
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
      const begin = new FormData();
      begin.set('patient', patient); begin.set('locale', locale);
      begin.set('filename', chosen.name); begin.set('size', String(chosen.size));
      begin.set('header', toBase64(buffer.subarray(0, HEADER_SAMPLE_BYTES)));
      begin.set('sha256', [...digest].map(b => b.toString(16).padStart(2, '0')).join(''));
      const started = await beginUpload({ message: '' }, begin);
      if (started.message || !started.uploadUrl || !started.documentId) throw new Error(started.message || 'notStarted');
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', started.uploadUrl!, true);
        xhr.setRequestHeader('content-type', 'application/octet-stream');
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.upload.onprogress = progress => {
          if (progress.lengthComputable) {
            dispatch({ type: 'progress', percent: Math.round(progress.loaded / progress.total * 100) });
          }
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve()
          : reject(new Error(xhr.status === 413 ? 'storageRejected' : 'interrupted'));
        xhr.onerror = () => reject(new Error('interrupted'));
        xhr.onabort = () => reject(new Error('interrupted'));
        xhr.ontimeout = () => reject(new Error('interrupted'));
        xhr.send(chosen);
      });
      // The bytes have arrived. They have NOT been read. Recording the id here - before
      // verification, not after - is what lets a retry resume at verification instead of
      // sending the file a second time.
      documentId = started.documentId;
      dispatch({ type: 'delivered', documentId });
    }

    const finish = new FormData();
    finish.set('patient', patient); finish.set('locale', locale); finish.set('documentId', documentId);
    const done = await finishUpload({ message: '' }, finish);
    if (done.message !== 'stored') throw new Error(done.message || 'verifyFailed');
    dispatch({ type: 'verified' });
    return documentId;
  }

  async function send() {
    if (!canSend(draft)) {
      if (draft.phase === 'idle') dispatch({ type: 'failed', message: 'sendEmpty' });
      return;
    }
    const state = draft;
    dispatch({ type: 'send' });
    // Every path out of this function passes through one of these dispatches, so the
    // controls can never be left disabled by a rejected request.
    let documentId = '';
    try {
      documentId = await uploadIfNeeded(state);
    } catch (error) {
      dispatch({ type: 'failed', message: (error as Error)?.message || 'interrupted' });
      return;
    }
    dispatch({ type: 'posting' });
    try {
      const form = new FormData();
      form.set('locale', locale); form.set('patient', patient);
      form.set('token', state.token); form.set('text', state.text.trim());
      form.set('documentId', documentId);
      form.set('attachment', documentId ? 'stored' : state.fileName ? 'failed' : 'none');
      const result = await sendMessage({ message: '' }, form);
      if (result.message || !result.added) {
        dispatch({ type: 'failed', message: result.message || 'sendUnavailable' });
        return;
      }
      setMessages(previous => [...previous, ...result.added!]);
      file.current = null;
      if (fileInput.current) fileInput.current.value = '';
      dispatch({ type: 'sent', token: newToken() });
    } catch {
      // A transport rejection. The turn keeps its token, so pressing Retry completes the
      // same turn rather than creating a second one.
      dispatch({ type: 'failed', message: 'sendUnavailable' });
    }
  }

  // Upload failures come from the document vocabulary, send failures from the chat one.
  const failureText = draft.failure
    ? (draft.failure in (t.chatMessages as Record<string, string>)
      ? actionMessage(locale, 'chatMessages', draft.failure)
      : actionMessage(locale, 'documentMessages', draft.failure))
    : '';

  const progress = draft.phase === 'uploading' ? `${t.chatUploadSending}${draft.percent ? ` ${draft.percent}%` : ''}`
    : draft.phase === 'uploaded' ? t.chatUploadStored
      : draft.phase === 'sending' ? t.chatSending : '';

  return <div className="conversation" dir={direction(locale)}>
    <div className="conversation-log" role="log" aria-live="polite" aria-label={t.chatHeading}>
      {unprepared && <p role="status" className="bubble assistant">{actionMessage(locale, 'chatMessages', 'sendUnprepared')}</p>}
      {messages.length === 0 && !unprepared && <p className="bubble assistant">{t.chatOpening}</p>}
      {messages.map(message => <div key={message.id} className={`turn ${message.role}`}>
        <div className={`bubble ${message.role}`}>
          <span className="tiny turn-who">{message.role === 'person' ? t.chatYou : t.chatAssistant}</span>
          {message.body && <p style={{ whiteSpace: 'pre-wrap' }}>{message.body}</p>}
          {message.documentName && <p className="tiny attachment" dir="ltr">{t.chatAttachment}: {message.documentName}</p>}
          <time className="tiny" dateTime={message.createdAt} dir="ltr">{formatTimestamp(locale, message.createdAt)}</time>
        </div>
        {message.facts.length > 0 && <div className="fact-list">
          <p className="tiny">{t.confirmHeading}</p>
          {message.facts.map(fact => <FactCard key={fact.id} fact={fact} patient={patient} locale={locale}/>)}
          <p className="tiny">{t.confirmNote}</p>
        </div>}
      </div>)}
      {progress && <p className="bubble assistant progress" role="status">{progress}</p>}
      <div ref={bottom}/>
    </div>

    {failureText && <div className="conversation-failure" role="alert">
      <p>{failureText}</p>
      <p className="tiny">{t.chatUploadKept}</p>
      <button className="button primary" type="button" onClick={send}>{t.chatRetry}</button>
    </div>}

    <form className="composer" onSubmit={event => { event.preventDefault(); void send(); }}>
      <label className="composer-attach">
        <span className="visually-hidden">{t.chatAttach}</span>
        <span aria-hidden="true" className="attach-mark">+</span>
        <input ref={fileInput} type="file" name="file" accept="application/pdf,image/jpeg,image/png"
          onChange={event => {
            // Choosing a different file discards the previous upload, so the message can
            // never be sent with a file the person has replaced.
            const chosen = event.target.files?.[0] ?? null;
            file.current = chosen;
            dispatch({ type: 'attach', fileName: chosen?.name ?? null });
          }}/>
      </label>
      <textarea name="text" rows={2} value={draft.text} placeholder={t.chatPlaceholder} maxLength={4000}
        aria-label={t.chatPlaceholder} onChange={event => dispatch({ type: 'edit', text: event.target.value })}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); }
        }}/>
      <button className="button primary composer-send" type="submit" disabled={draft.phase !== 'idle'}>
        {draft.phase === 'idle' ? t.chatSend : t.chatSending}
      </button>
    </form>
    {draft.fileName && <p className="tiny composer-file" dir="ltr">
      {t.chatAttachment}: {draft.fileName}
      <button className="text-link" type="button" onClick={() => {
        file.current = null;
        if (fileInput.current) fileInput.current.value = '';
        dispatch({ type: 'attach', fileName: null });
      }}>{t.chatAttachRemove}</button>
    </p>}
    <noscript><p className="tiny">{t.chatNeedsJs}</p></noscript>
  </div>;
}
