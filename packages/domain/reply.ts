// What the assistant says, decided deterministically before anything is generated.
//
// Milestone 10. This module never writes prose. It returns an ORDERED LIST OF TRANSLATION
// KEYS, so the same decision produces the same reply in Russian, Hebrew and English, and so
// a reviewer can read the whole behaviour of the conversation as a table instead of as
// model output.
//
// The ordering rules are the safety rules, in code:
//
//   * A safety match replaces the ordinary reply. It is never shown alongside routine
//     wellbeing content, and the app does not ask a clarifying question on top of an
//     escalation - a person being told to call for help is not also given homework.
//   * An attachment is described by what actually happened to it. "Stored" and "read" are
//     different keys, and the reader is never told the app has read a file it has not read.
//   * At most ONE clarification per reply, and only about something genuinely absent.
//   * When there is nothing the app can honestly answer, it says so. It does not fill the
//     turn with sympathy phrased as capability.
//
// Nothing here interprets a measurement. No threshold, no range, no "normal", no "high".

import type { SafetyDecision } from './safety.ts';
import type { Measurement, Reading } from './measurements.ts';
import { missingUnit } from './measurements.ts';

// How an attachment on this turn actually ended up, as observed - never as hoped.
export type AttachmentOutcome = 'none' | 'stored' | 'failed';

export interface ReplyInput {
  decision: SafetyDecision;
  reading: Reading;
  attachment: AttachmentOutcome;
  // Whether a model service is both configured and permitted to receive this data.
  // False is the ordinary state of this build; see apps/web/lib/assistant.ts.
  assistantAvailable: boolean;
  // Whether the person wrote anything at all besides the attachment.
  hasText: boolean;
}

export interface ReplyPlan {
  // Translation keys, in the order they are shown.
  parts: string[];
  // The single clarification, or null. Never more than one.
  clarify: Measurement | null;
  // Measurements to store as PROPOSED facts. Storing what a person reported is not advice,
  // so this still happens during an escalation: their reading is not lost because they also
  // described a red flag.
  propose: Measurement[];
  // True when the caller should ask the model for the remainder of the answer. False means
  // the parts above are the entire reply.
  generate: boolean;
}

export function planReply(input: ReplyInput): ReplyPlan {
  const { decision, reading, attachment, assistantAvailable, hasText } = input;
  const parts: string[] = [];
  const propose = reading.measurements;

  // The attachment is always reported first, because it is the thing the person is watching.
  if (attachment === 'failed') parts.push('replyAttachmentFailed');
  if (attachment === 'stored') {
    parts.push('replyAttachmentStored');
    // Stored is not read, and it is not read whether or not a model service is configured.
    // There is no document reader and no processing job anywhere in this application, so
    // there is nothing an attachment could be queued FOR. An earlier version said "I am
    // reading it now" as soon as a provider was configured, which the independent review of
    // 2026-09-21 correctly called a false claim: supplying an API key does not implement
    // reading a PDF. This line stays unconditional until a reader actually exists.
    parts.push('replyAttachmentNotRead');
  }

  // A safety match ends the reply. Nothing routine is appended, and no question is asked.
  if (decision.level !== 'none') {
    parts.push(decision.messageKey);
    if (propose.length) parts.push('replyRead');
    if (reading.measurements.length || hasText) parts.push('safetyWithheld');
    if (decision.truncated) parts.push('safetyTruncated');
    return { parts, clarify: null, propose, generate: false };
  }

  if (propose.length) parts.push('replyRead');

  // Only when the app has nothing else to say does it explain what it cannot do. A turn
  // that already read a measurement or stored a file is not padded with an apology.
  if (!propose.length && attachment === 'none' && hasText) {
    if (assistantAvailable) {
      if (decision.truncated) parts.push('safetyTruncated');
      return { parts, clarify: null, propose, generate: true };
    }
    parts.push('replyNoAssistant');
  }
  if (!parts.length) parts.push('replyNothingRead');
  if (decision.truncated) parts.push('safetyTruncated');

  return { parts, clarify: missingUnit(propose) ?? null, propose, generate: false };
}
