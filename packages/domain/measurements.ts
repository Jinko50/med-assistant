// Deterministic reading of measurements that a person WROTE IN WORDS.
//
// Milestone 10. This is the other half of the safety gate: like packages/domain/safety.ts
// it is pure, offline, and free of any model. The same sentence always yields the same
// reading, so it can be reviewed as a table instead of as model behaviour.
//
// The governing rule is the owner's: never invent units, dates or medical facts. That is
// enforced structurally, not by convention:
//
//   * Every number is bound to ITS OWN label. A number belongs to the nearest measurement
//     word, and only if that word is close enough. When two different measurement words are
//     equally close, the number is AMBIGUOUS and is dropped rather than assigned. A bare
//     "72" with no measurement word near it is never a reading.
//   * A unit is either written by the person, or fixed by the notation itself (a
//     systolic/diastolic pair is mmHg; that is what the "/" notation means), or ABSENT.
//     Absent is reported as absent - needsUnit - and becomes the one short clarification
//     the assistant is allowed to ask. It is never guessed. In particular a bare "degrees",
//     "градусов" or "מעלות" does NOT mean Celsius: the scale stays unknown until written.
//   * No calendar date is ever produced. "This morning" is kept as the person's own phrase.
//     The only real timestamp is the one the database writes when the row is stored.
//   * Nothing here interprets a reading. No threshold, no range, no "normal", no "high".
//     A number is meaningful only against a target recorded by the patient's own clinician.
//
// Honest limits, stated here so they are not lost downstream:
//   1. An empty result means NOTHING WAS RECOGNISED. It does not mean the person reported
//      nothing, and no caller may present it as though the message contained no measurements.
//   2. The vocabulary below is a fixed list of written word forms, not a morphological
//      analyser. An inflection nobody listed is simply not recognised - which produces
//      silence, not a wrong reading.

export type MeasurementKind = 'blood_pressure' | 'pulse' | 'temperature' | 'weight' | 'glucose' | 'oxygen';

export interface Measurement {
  kind: MeasurementKind;
  // Exactly what was written, with a decimal comma normalised to a point. Never rounded,
  // never reformatted, never converted between units.
  value: string;
  // Canonical unit, or '' when the person did not write one and the notation does not fix it.
  unit: string;
  // true  - the person wrote the unit.
  // false with a unit - the notation fixes it (120/80 is mmHg, a pulse is per minute).
  // false with '' - unknown; see needsUnit.
  unitStated: boolean;
  // The unit is genuinely missing and matters. The caller may ask ONE clarification.
  needsUnit: boolean;
  // The exact span of the original text this was read from, for showing provenance.
  text: string;
  at: number;
}

// The person's own words about when. Deliberately not a date.
export interface ReportedTime {
  phrase: string;
  day: 'today' | 'yesterday' | null;
  partOfDay: 'morning' | 'midday' | 'evening' | 'night' | null;
}

export interface Reading {
  measurements: Measurement[];
  time: ReportedTime | null;
}

// Bounded, like the safety screen, so a long paste cannot become unbounded work.
export const MAX_READ_CHARS = 4000;

// Lowercased, punctuation kept where it carries meaning ("/" in 135/80, "%" in 96%,
// "." and "," as decimal separators, the degree sign). Hebrew points are removed because
// they are invisible to the writer's intent. Length is preserved so that every offset in
// the folded text still points at the same character of the original.
function fold(text: string) {
  return text
    .replace(/[֑-ׇ]/g, ' ')
    .replace(/[̀-ͯ]/g, ' ')
    .toLowerCase()
    .replace(/ё/g, 'е');
}

const NUMBER = '\\d{1,3}(?:[.,]\\d{1,2})?';

// Written word forms, not stems. A stem would silently over-match: Russian "вес" (weight)
// is the first three letters of "весь" (whole), so "весь день" would have been read as a
// weight. Matching whole words against an explicit list cannot do that. Hebrew attaches
// one-letter particles to the following word, so a Hebrew form may carry up to two of them
// - "ודופק" is "and pulse" - exactly as in packages/domain/safety.ts.
const KEYWORDS: Record<MeasurementKind, string[]> = {
  blood_pressure: ['blood pressure', 'bp', 'pressure',
    'давление', 'давления', 'давлении', 'давлением', 'ад', 'а/д',
    'לחץ דם', 'לחץ הדם', 'לחץ'],
  pulse: ['pulse', 'heart rate', 'heartrate',
    'пульс', 'пульса', 'пульсе', 'чсс',
    'דופק', 'הדופק', 'קצב לב'],
  temperature: ['temperature', 'temp', 'fever',
    'температура', 'температуру', 'температуры', 'температура тела',
    'חום', 'טמפרטורה'],
  weight: ['weight', 'weigh', 'weighs', 'weighed',
    'вес', 'веса', 'весе', 'весом', 'весит', 'весила', 'весил',
    'משקל', 'המשקל', 'שוקל', 'שוקלת'],
  glucose: ['glucose', 'blood sugar', 'sugar',
    'глюкоза', 'глюкозы', 'глюкоза крови', 'сахар', 'сахара', 'сахар крови',
    'גלוקוז', 'סוכר', 'הסוכר'],
  oxygen: ['saturation', 'oxygen', 'spo2', 'sats',
    'сатурация', 'сатурации', 'кислород', 'насыщение',
    'סטורציה', 'סטורצית', 'חמצן', 'ריווי חמצן'],
};

const HEBREW_PREFIXES = 'והבלמשכ';
const hebrew = (word: string) => /[֐-׿]/.test(word);
const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One regex per written form. Unicode letter/digit lookarounds are used rather than \b,
// which JavaScript defines over [A-Za-z0-9_] only and which therefore never fires beside
// Cyrillic or Hebrew.
const keywordPatterns = new Map<string, RegExp>();
function keywordPattern(form: string) {
  const cached = keywordPatterns.get(form);
  if (cached) return cached;
  const body = form.split(' ').map(word =>
    hebrew(word) ? `[${HEBREW_PREFIXES}]{0,2}${escape(word)}` : escape(word)).join(' ');
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, 'gu');
  keywordPatterns.set(form, pattern);
  return pattern;
}

// Written units. Each entry maps written forms to the canonical unit recorded.
function unitPattern(...forms: string[]) {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.join('|')})(?![\\p{L}\\p{N}])`, 'u');
}
const UNITS: Record<MeasurementKind, Array<[RegExp, string]>> = {
  blood_pressure: [[unitPattern('mmhg', 'mm\\s*hg', 'мм\\s*рт\\.?\\s*ст\\.?', 'ммрт', 'ממ כספית'), 'mmHg']],
  pulse: [[unitPattern('bpm', '\\/\\s*min', 'per minute', 'уд\\.?\\s*\\/?\\s*мин\\.?', 'ударов в минуту', 'לדקה'), '/min']],
  // Only a NAMED scale counts. "градусов" and "מעלות" mean degrees and say nothing about
  // which scale, so they are deliberately absent from this table: 37.8 is not assumed to be
  // Celsius and 98.6 is not assumed to be Fahrenheit. The gap becomes the one clarification.
  temperature: [
    [unitPattern('°\\s*c', 'c', 'celsius', 'цельси\\p{L}*', 'по цельсию', 'צלזיוס', 'מעלות צלזיוס'), '°C'],
    [unitPattern('°\\s*f', 'f', 'fahrenheit', 'фаренгейт\\p{L}*', 'פרנהייט'), '°F'],
  ],
  weight: [
    [unitPattern('kg', 'kilo\\p{L}*', 'кг', 'килограмм\\p{L}*', 'ק"ג', 'קג', 'קילו'), 'kg'],
    [unitPattern('lbs?', 'pounds?', 'фунт\\p{L}*'), 'lb'],
  ],
  glucose: [
    [unitPattern('mmol\\s*\\/?\\s*l', 'ммоль\\s*\\/?\\s*л'), 'mmol/L'],
    [unitPattern('mg\\s*\\/?\\s*dl', 'мг\\s*\\/?\\s*дл'), 'mg/dL'],
  ],
  oxygen: [[/%/u, '%']],
};

// How far from a measurement word a number may sit and still belong to it. Wide enough for
// "blood pressure this morning was 135/80", narrow enough that the next clause's number is
// not captured.
const NEAR = 40;

interface Occurrence { kind: MeasurementKind; at: number; end: number }

function occurrences(haystack: string): Occurrence[] {
  const found: Occurrence[] = [];
  for (const kind of Object.keys(KEYWORDS) as MeasurementKind[]) {
    for (const form of KEYWORDS[kind]) {
      const pattern = keywordPattern(form);
      pattern.lastIndex = 0;
      for (let match = pattern.exec(haystack); match; match = pattern.exec(haystack)) {
        found.push({ kind, at: match.index, end: match.index + match[0].length });
      }
    }
  }
  return found;
}

// The gap between a measurement word and a number: the characters lying between them, on
// whichever side the word sits. Zero when they touch.
function gap(occurrence: Occurrence, at: number, length: number) {
  return occurrence.end <= at ? at - occurrence.end : occurrence.at - (at + length);
}

// Which measurement this number belongs to. The nearest word wins. If the nearest distance
// is shared by words of two different kinds, the number is ambiguous and nothing is read -
// preserving the ambiguity is the whole point, because a confirmation step cannot repair a
// reading that was attached to the wrong label.
function owner(all: Occurrence[], at: number, length: number): MeasurementKind | null {
  let best = Infinity;
  let kinds = new Set<MeasurementKind>();
  for (const occurrence of all) {
    const distance = gap(occurrence, at, length);
    if (distance < 0 || distance > NEAR) continue;
    if (distance < best) { best = distance; kinds = new Set([occurrence.kind]); }
    else if (distance === best) kinds.add(occurrence.kind);
  }
  return kinds.size === 1 ? [...kinds][0] : null;
}

function unitNear(kind: MeasurementKind, haystack: string, from: number, to: number) {
  const window = haystack.slice(Math.max(0, from - 14), Math.min(haystack.length, to + 18));
  for (const [pattern, unit] of UNITS[kind]) if (pattern.test(window)) return unit;
  return '';
}

function measurement(kind: MeasurementKind, haystack: string, at: number, text: string, fixedUnit: string): Measurement {
  const written = unitNear(kind, haystack, at, at + text.length);
  const unit = written || fixedUnit;
  return {
    kind,
    value: text.replace(/\s+/g, '').replace(',', '.'),
    unit,
    unitStated: Boolean(written),
    needsUnit: !unit,
    text,
    at,
  };
}

// Ordered, so a reply lists readings the way the sentence did. One reading per kind: a
// person writing two pulses in one message is ambiguous, and the first is what they led
// with. Nothing is merged or averaged.
export function extractMeasurements(text: string): Measurement[] {
  const haystack = fold(typeof text === 'string' ? text.slice(0, MAX_READ_CHARS) : '');
  if (!haystack.trim()) return [];
  const all = occurrences(haystack);
  if (!all.length) return [];
  const found: Measurement[] = [];

  // A systolic/diastolic pair first. Only a blood-pressure word may claim one: nothing else
  // is written as a pair, so the nearest-word rule is not applied to it.
  const covered: Array<[number, number]> = [];
  const bloodPressure = all.filter(occurrence => occurrence.kind === 'blood_pressure');
  for (const match of haystack.matchAll(/\d{2,3}\s*\/\s*\d{2,3}/g)) {
    const at = match.index ?? 0;
    const near = bloodPressure.some(occurrence => {
      const distance = gap(occurrence, at, match[0].length);
      return distance >= 0 && distance <= NEAR;
    });
    // The halves are consumed either way: in "pulse 135/80" the pair is not a pulse, and
    // neither 135 nor 80 may be read as one.
    covered.push([at, at + match[0].length]);
    if (near) found.push(measurement('blood_pressure', haystack, at, match[0], 'mmHg'));
  }

  // Then every remaining number, each bound to its own nearest measurement word.
  for (const match of haystack.matchAll(new RegExp(`(?<![\\p{L}\\p{N}.,/])${NUMBER}(?![\\p{L}\\p{N}/])`, 'gu'))) {
    const at = match.index ?? 0;
    if (covered.some(([from, to]) => at >= from && at < to)) continue;
    const kind = owner(all, at, match[0].length);
    // A blood-pressure word cannot claim a single number: which half of the pair it would
    // be is unknowable, so the number is left unread rather than recorded as half a reading.
    if (!kind || kind === 'blood_pressure') continue;
    found.push(measurement(kind, haystack, at, match[0], kind === 'pulse' ? '/min' : ''));
  }

  const first = new Map<MeasurementKind, Measurement>();
  for (const reading of found.sort((a, b) => a.at - b.at)) {
    if (!first.has(reading.kind)) first.set(reading.kind, reading);
  }
  return [...first.values()].sort((a, b) => a.at - b.at);
}

// Phrases about when, in the three languages. The phrase is preserved verbatim; day and
// partOfDay are only coarse tags the caller may use for grouping. Nothing here yields a
// calendar date, because the person did not give one.
const TIME_PHRASES: Array<[string, ReportedTime['day'], ReportedTime['partOfDay']]> = [
  ['this morning', 'today', 'morning'], ['yesterday morning', 'yesterday', 'morning'],
  ['yesterday evening', 'yesterday', 'evening'], ['last night', 'yesterday', 'night'],
  ['this evening', 'today', 'evening'], ['this afternoon', 'today', 'midday'],
  ['tonight', 'today', 'night'], ['yesterday', 'yesterday', null], ['today', 'today', null],
  ['сегодня утром', 'today', 'morning'], ['вчера утром', 'yesterday', 'morning'],
  ['сегодня вечером', 'today', 'evening'], ['вчера вечером', 'yesterday', 'evening'],
  ['сегодня ночью', 'today', 'night'], ['утром', null, 'morning'],
  ['вечером', null, 'evening'], ['ночью', null, 'night'], ['днем', null, 'midday'],
  ['вчера', 'yesterday', null], ['сегодня', 'today', null],
  ['אתמול בבוקר', 'yesterday', 'morning'], ['אתמול בערב', 'yesterday', 'evening'],
  ['אחר הצהריים', 'today', 'midday'], ['הבוקר', 'today', 'morning'],
  ['הערב', 'today', 'evening'], ['בלילה', null, 'night'],
  ['אתמול', 'yesterday', null], ['היום', 'today', null],
];

// The longest matching phrase wins, so "yesterday morning" is not read as "yesterday".
export function extractTime(text: string): ReportedTime | null {
  const haystack = fold(typeof text === 'string' ? text.slice(0, MAX_READ_CHARS) : '');
  if (!haystack.trim()) return null;
  let best: ReportedTime | null = null;
  let bestLength = 0;
  for (const [phrase, day, partOfDay] of TIME_PHRASES) {
    if (phrase.length > bestLength && haystack.includes(phrase)) {
      best = { phrase, day, partOfDay };
      bestLength = phrase.length;
    }
  }
  return best;
}

export function read(text: string): Reading {
  return { measurements: extractMeasurements(text), time: extractTime(text) };
}

// At most ONE clarification per reply, and only about something genuinely absent. The
// assistant never asks for a unit it could read, and never asks twice in one turn.
export function missingUnit(measurements: Measurement[]): Measurement | undefined {
  return measurements.find(m => m.needsUnit);
}

// Exposed so tests and a reviewer can see exactly what is recognised.
export const vocabulary = { keywords: KEYWORDS, units: UNITS, times: TIME_PHRASES, near: NEAR };
