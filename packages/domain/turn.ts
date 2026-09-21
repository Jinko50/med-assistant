// The state of one turn a person is composing, as a pure state machine.
//
// This lives outside the React component on purpose. The behaviour it encodes is what the
// independent review of 2026-09-21 found broken, and none of it is testable through a
// source-string assertion:
//
//   * A failure must never eat the message. Text, attachment and the turn's token all
//     survive every failure, so Retry resends the same turn rather than a new one.
//   * Retry must not re-send bytes that already arrived. The upload has two stages -
//     the object reaching Storage, and the server verifying it - and a failure of the
//     second must resume at the second, not at the first. Re-uploading 40 MB because
//     verification timed out is the defect this prevents.
//   * The controls must never be left stuck. Every terminal event returns the machine to
//     'idle', so a transport rejection cannot leave Send disabled forever.
//   * Choosing a different file discards the previous upload, so a message can never be
//     sent carrying a file the person has replaced.

export type TurnPhase = 'idle' | 'uploading' | 'uploaded' | 'sending';

export interface TurnState {
  text: string;
  fileName: string | null;
  // Identifies this turn to the server. Kept across retries and replaced only once the turn
  // is actually stored, which is what makes a retry idempotent rather than duplicating.
  token: string;
  // The document row whose bytes have reached Storage but which the server has not yet
  // verified. A retry resumes from here.
  pendingId: string;
  // The document row the server has verified and finalized.
  storedId: string;
  phase: TurnPhase;
  percent: number;
  // A translation key, or '' when there is nothing wrong.
  failure: string;
}

export type TurnEvent =
  | { type: 'edit'; text: string }
  | { type: 'attach'; fileName: string | null }
  | { type: 'send' }
  | { type: 'progress'; percent: number }
  // The bytes are in Storage. NOT that anything has read them.
  | { type: 'delivered'; documentId: string }
  // The server re-read the object's header and size and finalized the row.
  | { type: 'verified' }
  | { type: 'posting' }
  | { type: 'failed'; message: string }
  | { type: 'sent'; token: string };

export function emptyTurn(token: string): TurnState {
  return { text: '', fileName: null, token, pendingId: '', storedId: '', phase: 'idle', percent: 0, failure: '' };
}

// What the next attempt has to do about the attachment.
export function uploadStep(state: TurnState): 'none' | 'begin' | 'verify' {
  if (!state.fileName) return 'none';
  if (state.storedId) return 'none';
  return state.pendingId ? 'verify' : 'begin';
}

export function canSend(state: TurnState): boolean {
  return state.phase === 'idle' && (state.text.trim().length > 0 || state.fileName !== null);
}

export function turn(state: TurnState, event: TurnEvent): TurnState {
  switch (event.type) {
    case 'edit':
      // Typing clears a previous failure notice but never the upload already achieved.
      return { ...state, text: event.text, failure: state.phase === 'idle' ? '' : state.failure };
    case 'attach':
      // A different file means the previous upload is irrelevant; nothing about it is kept.
      return { ...state, fileName: event.fileName, pendingId: '', storedId: '', percent: 0, failure: '' };
    case 'send':
      if (!canSend(state)) return state;
      return { ...state, failure: '', percent: 0, phase: uploadStep(state) === 'none' ? 'sending' : 'uploading' };
    case 'progress':
      return state.phase === 'uploading' ? { ...state, percent: event.percent } : state;
    case 'delivered':
      // "uploaded" is a separate, visible state from "read": nothing has read the file.
      return { ...state, pendingId: event.documentId, phase: 'uploaded', percent: 100 };
    case 'verified':
      return { ...state, storedId: state.pendingId, phase: 'uploaded' };
    case 'posting':
      return { ...state, phase: 'sending' };
    case 'failed':
      // Everything the person supplied survives, including the token and whatever part of
      // the upload succeeded. The controls are released.
      return { ...state, phase: 'idle', percent: 0, failure: event.message };
    case 'sent':
      return emptyTurn(event.token);
  }
}
