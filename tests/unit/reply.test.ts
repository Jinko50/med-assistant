import test from 'node:test';
import assert from 'node:assert/strict';
import { planReply, type ReplyInput } from '../../packages/domain/reply.ts';
import { screen } from '../../packages/domain/safety.ts';
import { read } from '../../packages/domain/measurements.ts';
import { locales, translations, replyText } from '../../apps/web/lib/i18n.ts';

// What the assistant says is decided before anything is generated. These assertions are
// the safety rules of the conversation, written as a table.

function plan(text: string, over: Partial<ReplyInput> = {}) {
  return planReply({
    decision: screen(text), reading: read(text), attachment: 'none',
    assistantAvailable: false, hasText: Boolean(text.trim()), ...over,
  });
}

test('a safety match replaces the reply and is never mixed with routine content', () => {
  const result = plan('I have chest pain');
  assert.equal(result.parts[0], 'safetyEmergency');
  assert.ok(result.parts.includes('safetyWithheld'));
  assert.equal(result.generate, false, 'no model answer is composed over an escalation');
  assert.ok(!result.parts.includes('replyNoAssistant'), 'no apology is appended to an emergency');
});

test('an escalation never also asks a question', () => {
  // "temperature 37.8" has no unit, which would otherwise earn the one clarification.
  const result = plan('chest pain and temperature 37.8');
  assert.equal(result.clarify, null, "no homework during an escalation");
  assert.equal(result.parts[0], 'safetyEmergency');
});

test('a reading is still recorded during an escalation, so nothing the person said is lost', () => {
  const result = plan('I have chest pain, blood pressure 135/80');
  assert.deepEqual(result.propose.map(m => m.kind), ['blood_pressure']);
  assert.ok(result.parts.includes('replyRead'));
});

test('a medication question is routed to a person, above an urgent match', () => {
  const result = plan('I have a fever, should I stop taking it');
  assert.equal(result.parts[0], 'safetyMedication');
});

test('"uploaded" and "read" are different statements, whatever is configured', () => {
  // Corrected after the independent review of 2026-09-21. An earlier version switched to
  // "I am reading it now" as soon as a provider was configured. There is no document
  // reader and no processing job anywhere in this application, so configuring an API key
  // does not make that true. The claim is gone until a reader actually exists.
  for (const assistantAvailable of [false, true]) {
    const stored = plan('', { attachment: 'stored', hasText: false, assistantAvailable });
    assert.ok(stored.parts.includes('replyAttachmentStored'));
    assert.ok(stored.parts.includes('replyAttachmentNotRead'),
      'a stored file must never be described as read');
    assert.equal(stored.parts.includes('replyAttachmentQueued'), false,
      'nothing may claim to be reading an attachment');
  }
});

test('a failed upload says nothing was stored', () => {
  const result = plan('here is my letter', { attachment: 'failed' });
  assert.equal(result.parts[0], 'replyAttachmentFailed');
});

test('without a model service the app says so, instead of answering anyway', () => {
  const result = plan('what does my last test mean?');
  assert.deepEqual(result.parts, ['replyNoAssistant']);
  assert.equal(result.generate, false);
});

test('with a model service an ordinary question is generated, not templated', () => {
  const result = plan('what does my last test mean?', { assistantAvailable: true });
  assert.equal(result.generate, true);
  assert.deepEqual(result.parts, []);
});

test('a turn that read a measurement is not padded with an apology', () => {
  const result = plan('pulse 72');
  assert.ok(result.parts.includes('replyRead'));
  assert.ok(!result.parts.includes('replyNoAssistant'),
    'the app explains what it cannot do only when it has nothing else to say');
  assert.equal(result.generate, false);
});

test('one clarification at most, and only about an absent unit', () => {
  assert.equal(plan('pulse 72').clarify, null, 'a unit the notation fixes is not asked about');
  assert.equal(plan('temperature 37.8').clarify?.kind, 'temperature');
  const two = plan('temperature 37.8 and weight 78');
  assert.equal(two.propose.length, 2);
  assert.equal(two.clarify?.kind, 'temperature', 'still exactly one question');
});

test('not every message produces a confirmation', () => {
  const chat = plan('I slept badly last night');
  assert.deepEqual(chat.propose, [], 'ordinary talk proposes nothing to confirm');
});

test('a truncated message says so rather than pretending it was all read', () => {
  const long = `pulse 72 ${'x'.repeat(5000)}`;
  const result = plan(long);
  assert.ok(result.parts.includes('safetyTruncated'));
});

test('a reply is never empty', () => {
  for (const input of ['', 'hello', 'pulse 72']) {
    assert.ok(plan(input).parts.length > 0 || plan(input).generate, JSON.stringify(input));
  }
});

test('every key a plan can emit exists in all three languages', () => {
  const emitted = new Set<string>();
  const inputs: Array<[string, Partial<ReplyInput>]> = [
    ['I have chest pain', {}], ['should I stop taking it', {}], ['I have a fever', {}],
    ['pulse 72', {}], ['temperature 37.8', {}], ['hello', {}], ['hello', { assistantAvailable: true }],
    ['', { attachment: 'stored', hasText: false }],
    ['', { attachment: 'stored', hasText: false, assistantAvailable: true }],
    ['pulse 72', { attachment: 'stored' }],
    ['x', { attachment: 'failed' }], [`pulse 72 ${'x'.repeat(5000)}`, {}],
  ];
  for (const [text, over] of inputs) for (const key of plan(text, over).parts) emitted.add(key);
  // Plus the two keys the caller adds around a plan.
  for (const key of ['replyClarifyUnit', 'replyAssistantFailed']) emitted.add(key);
  assert.ok(emitted.size >= 8, 'the table must actually exercise the vocabulary');
  for (const locale of locales) {
    for (const key of emitted) {
      const value = (translations[locale] as unknown as Record<string, unknown>)[key];
      assert.equal(typeof value, 'string', `${locale} is missing ${key}`);
      assert.ok((value as string).trim().length > 0, `${locale}.${key} is empty`);
    }
  }
});

test('an unknown key becomes a visible notice, never a silently dropped line', () => {
  const text = replyText('ru', ['replyRead', 'notAKeyThatExists']);
  assert.ok(text.includes(translations.ru.messageUnknown));
  assert.ok(text.includes(translations.ru.replyRead));
});
