import test from 'node:test';
import assert from 'node:assert/strict';
import { turn, emptyTurn, uploadStep, canSend, type TurnState, type TurnEvent } from '../../packages/domain/turn.ts';

// Behavioural tests of what happens to a person's message when the network misbehaves.
// Written after the independent review of 2026-09-21 found these paths untested: the
// previous suite asserted on source strings, which cannot show that Retry resumes rather
// than restarts, or that a rejected request releases the controls.

const play = (state: TurnState, ...events: TurnEvent[]) => events.reduce(turn, state);
const composed = (text = 'pulse 72', fileName: string | null = null) =>
  play(emptyTurn('token-1'), { type: 'edit', text }, ...(fileName ? [{ type: 'attach' as const, fileName }] : []));

test('a turn starts empty and cannot be sent', () => {
  const state = emptyTurn('token-1');
  assert.equal(canSend(state), false);
  assert.equal(uploadStep(state), 'none');
  // Pressing Send on an empty composer changes nothing.
  assert.deepEqual(turn(state, { type: 'send' }), state);
});

test('text alone, or a file alone, is enough to send', () => {
  assert.equal(canSend(composed('hello')), true);
  assert.equal(canSend(composed('', 'scan.pdf')), true);
});

test('a failed send keeps the text, the file and the turn’s identity', () => {
  const state = play(composed('давление 135/80', 'scan.pdf'),
    { type: 'send' }, { type: 'failed', message: 'sendUnavailable' });
  assert.equal(state.text, 'давление 135/80', 'the message must survive the failure');
  assert.equal(state.fileName, 'scan.pdf', 'the attachment must survive the failure');
  assert.equal(state.token, 'token-1', 'the same turn is retried, not a new one');
  assert.equal(state.failure, 'sendUnavailable');
});

test('every failure releases the controls', () => {
  // The defect this covers: a rejected request left phase set, so Send stayed disabled
  // and the person could do nothing but reload and lose what they had typed.
  for (const phase of ['uploading', 'uploaded', 'sending'] as const) {
    const stuck: TurnState = { ...composed('hello', 'scan.pdf'), phase };
    const after = turn(stuck, { type: 'failed', message: 'interrupted' });
    assert.equal(after.phase, 'idle', `a failure during ${phase} must release the controls`);
    assert.equal(canSend(after), true, `the person must be able to retry after ${phase}`);
  }
});

test('Retry after a verification failure resumes; it does not upload the file again', () => {
  // Storage accepted the bytes, then finishUpload failed. This is the 40 MB case: sending
  // the file a second time is the thing that must not happen.
  const state = play(composed('', 'scan.pdf'),
    { type: 'send' },
    { type: 'progress', percent: 100 },
    { type: 'delivered', documentId: 'doc-1' },
    { type: 'failed', message: 'verifyFailed' });
  assert.equal(state.pendingId, 'doc-1', 'the delivered object must be remembered');
  assert.equal(state.storedId, '', 'it is not verified, so it is not stored');
  assert.equal(uploadStep(state), 'verify', 'Retry must resume at verification');

  const verified = play(state, { type: 'send' }, { type: 'verified' });
  assert.equal(verified.storedId, 'doc-1');
  assert.equal(uploadStep(verified), 'none', 'a verified file is never uploaded again');
});

test('Retry after a send failure re-uses the verified upload', () => {
  const state = play(composed('here it is', 'scan.pdf'),
    { type: 'send' }, { type: 'delivered', documentId: 'doc-1' }, { type: 'verified' },
    { type: 'posting' }, { type: 'failed', message: 'sendUnavailable' });
  assert.equal(uploadStep(state), 'none', 'the file is already stored');
  assert.equal(state.storedId, 'doc-1');
  assert.equal(state.token, 'token-1', 'the server must recognise this as the same turn');
});

test('a retry only starts the upload from the beginning when nothing arrived', () => {
  const state = play(composed('', 'scan.pdf'), { type: 'send' }, { type: 'failed', message: 'interrupted' });
  assert.equal(uploadStep(state), 'begin');
});

test('choosing a different file discards the previous upload entirely', () => {
  // Otherwise a message could be sent carrying the file the person just replaced.
  const state = play(composed('', 'old.pdf'),
    { type: 'send' }, { type: 'delivered', documentId: 'doc-1' }, { type: 'verified' },
    { type: 'attach', fileName: 'new.pdf' });
  assert.equal(state.pendingId, '');
  assert.equal(state.storedId, '');
  assert.equal(uploadStep(state), 'begin');
  assert.equal(state.fileName, 'new.pdf');
});

test('removing the attachment leaves the typed text alone', () => {
  const state = play(composed('pulse 72', 'scan.pdf'), { type: 'attach', fileName: null });
  assert.equal(state.text, 'pulse 72');
  assert.equal(uploadStep(state), 'none');
  assert.equal(canSend(state), true);
});

test('a successful send clears the composer and starts a new turn', () => {
  const state = play(composed('pulse 72', 'scan.pdf'),
    { type: 'send' }, { type: 'delivered', documentId: 'doc-1' }, { type: 'verified' },
    { type: 'posting' }, { type: 'sent', token: 'token-2' });
  assert.deepEqual(state, emptyTurn('token-2'));
  assert.equal(state.token, 'token-2', 'the next turn must not reuse the stored turn’s token');
});

test('Send cannot be pressed twice while a turn is in flight', () => {
  const sending = play(composed('hello'), { type: 'send' });
  assert.equal(sending.phase, 'sending');
  assert.deepEqual(turn(sending, { type: 'send' }), sending, 'a second press is ignored');
});

test('progress is only reported while bytes are actually moving', () => {
  const sending = play(composed('hello'), { type: 'send' });
  assert.equal(turn(sending, { type: 'progress', percent: 50 }).percent, 0,
    'a text-only turn has no upload to report progress for');
});

test('"delivered" and "verified" are distinct states, because uploaded is not read', () => {
  const delivered = play(composed('', 'scan.pdf'), { type: 'send' }, { type: 'delivered', documentId: 'doc-1' });
  assert.equal(delivered.storedId, '', 'delivery is not verification');
  assert.equal(turn(delivered, { type: 'verified' }).storedId, 'doc-1');
});

test('typing after a failure clears the notice but keeps what the upload achieved', () => {
  const state = play(composed('', 'scan.pdf'),
    { type: 'send' }, { type: 'delivered', documentId: 'doc-1' },
    { type: 'failed', message: 'verifyFailed' },
    { type: 'edit', text: 'here is the letter' });
  assert.equal(state.failure, '');
  assert.equal(state.pendingId, 'doc-1');
  assert.equal(state.text, 'here is the letter');
});
