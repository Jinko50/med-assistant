// Deterministic reading of measurements that a person WROTE IN WORDS.
//
// Milestone 10. This is the other half of the safety gate: like packages/domain/safety.ts
// it is pure, offline, and free of any model. The same sentence always yields the same
// reading, so it can be reviewed as a table instead of as model behaviour.
//
// The governing rule is the owner's: never invent units, dates or medical facts. That is
// enforced structurally, not by convention:
//
//   * A value is only read when a keyword for that measurement is present. A bare "72" is
//     never a pulse.
//   * A unit is either written by the person (unitStated: true), fixed by the notation
//     itself (a systolic/diastolic pair is mmHg; that is what the "/" notation means), or
//     ABSENT. Absent is reported as absent - needsUnit - and becomes the one short
//     clarification the assistant is allowed to ask. It is never guessed from magnitude:
//     37.8 is not assumed to be Celsius and 98.6 is not assumed to be Fahrenheit.
//   * No calendar date is ever produced. "This morning" is kept as the person's own phrase.
//     The only real timestamp is the one the database writes when the row is stored.
//   * Nothing here interprets a reading. No threshold, no range, no "normal", no "high".
//     A number is meaningful only against a target recorded by the patient's own clinician.
//
// Honest limit, stated here so it is not lost downstream: an empty result means NOTHING WAS
// RECOGNISED. It does not mean the person reported nothing, and no caller may present it
// as though the message contained no measurements.

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
// they are invisible to the writer's intent.
function fold(text: string) {
  return text.normalize('NFKD')
    .replace(/[֑-ׇ]/g, '')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/ё/g, 'е');
}

const NUMBER = '\\d{1,3}(?:[.,]\\d{1,2})?';

// Keywords are matched as substrings of the folded text. Russian and Hebrew both inflect
// heavily, so a stem is used rather than a whole word: "давлен" covers давление/давления,
// "пульс" covers пульса/пульсе, "לחץ דם" covers the ordinary written forms.
const KEYWORDS: Record<MeasurementKind, string[]> = {
  blood_pressure: ['blood pressure', 'pressure', 'bp', 'давлен', 'а/д', 'לחץ דם', 'לחץ'],
  pulse: ['pulse', 'heart rate', 'heartrate', 'пульс', 'чсс', 'דופק', 'קצב לב'],
  temperature: ['temperature', 'temp', 'температур', 'חום', 'טמפרטור'],
  weight: ['weight', 'weigh', 'вес', 'весит', 'משקל', 'שוקל'],
  glucose: ['glucose', 'blood sugar', 'sugar', 'глюкоз', 'сахар', 'גלוקוז', 'סוכר'],
  oxygen: ['saturation', 'oxygen', 'spo2', 'sats', 'сатураци', 'кислород', 'סטורצי', 'חמצן'],
};

// Written units. Each entry maps written forms to the canonical unit recorded.
//
// JavaScript's \b is defined over [A-Za-z0-9_] only, so it silently never matches beside
// Cyrillic or Hebrew: /\bкг\b/ cannot fire in "вес 78 кг". Unicode letter/digit lookarounds
// are used instead, which behave identically in all three languages.
function unitPattern(...forms: string[]) {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${forms.join('|')})(?![\\p{L}\\p{N}])`, 'u');
}
const UNITS: Record<MeasurementKind, Array<[RegExp, string]>> = {
  blood_pressure: [[unitPattern('mmhg', 'mm\\s*hg', 'мм\\s*рт\\.?\\s*ст\\.?', 'ммрт', 'ממ כספית'), 'mmHg']],
  pulse: [[unitPattern('bpm', '\\/\\s*min', 'per minute', 'уд\\.?\\s*\\/?\\s*мин\\.?', 'ударов в минуту', 'לדקה'), '/min']],
  temperature: [
    [unitPattern('°\\s*c', 'c', 'celsius', 'цельси\\p{L}*', 'מעלות צלזיוס'), '°C'],
    [unitPattern('°\\s*f', 'f', 'fahrenheit'), '°F'],
  ],
  weight: [
    [unitPattern('kg', 'kilo\\p{L}*', 'кг', 'килограмм\\p{L}*', 'ק"ג', 'קילו'), 'kg'],
    [unitPattern('lbs?', 'pounds?', 'фунт\\p{L}*'), 'lb'],
  ],
  glucose: [
    [unitPattern('mmol\\s*\\/?\\s*l', 'ммоль\\s*\\/?\\s*л'), 'mmol/L'],
    [unitPattern('mg\\s*\\/?\\s*dl', 'мг\\s*\\/?\\s*дл'), 'mg/dL'],
  ],
  oxygen: [[/%/u, '%']],
};

// Written as "degrees" / "градусов" / "מעלות" without naming a scale. Celsius is the scale
// on every source document this family has, so it is filled in - but recorded as NOT stated
// by the person, exactly like a notational unit, so the confirmation shows it as something
// the app supplied and the Correct control can change it.
const IMPLIED: Partial<Record<MeasurementKind, Array<[RegExp, string]>>> = {
  temperature: [[unitPattern('градус\\p{L}*', 'מעלות'), '°C']],
};

// How far from the keyword a number may sit and still belong to it. Wide enough for
// "blood pressure this morning was 135/80", narrow enough that the next sentence's number
// is not captured.
const NEAR = 40;

function unitNear(table: Array<[RegExp, string]> | undefined, haystack: string, from: number, to: number) {
  if (!table) return '';
  const window = haystack.slice(Math.max(0, from - 14), Math.min(haystack.length, to + 18));
  for (const [pattern, unit] of table) if (pattern.test(window)) return unit;
  return '';
}

function keywordPositions(haystack: string, kind: MeasurementKind) {
  const found: number[] = [];
  for (const word of KEYWORDS[kind]) {
    for (let from = 0; ;) {
      const at = haystack.indexOf(word, from);
      if (at < 0) break;
      found.push(at);
      from = at + 1;
    }
  }
  return found;
}

// A number belongs to a keyword when it sits within NEAR characters of it, on either side.
function nearKeyword(positions: number[], at: number, length: number) {
  return positions.some(position => {
    const distance = position <= at ? at - position : position - (at + length);
    return distance >= 0 && distance <= NEAR;
  });
}

function reading(kind: MeasurementKind, haystack: string, pattern: RegExp, fixedUnit: string): Measurement[] {
  const positions = keywordPositions(haystack, kind);
  if (!positions.length) return [];
  const out: Measurement[] = [];
  for (const match of haystack.matchAll(pattern)) {
    const at = match.index ?? 0;
    const text = match[0];
    if (!nearKeyword(positions, at, text.length)) continue;
    const written = unitNear(UNITS[kind], haystack, at, at + text.length);
    const unit = written || unitNear(IMPLIED[kind], haystack, at, at + text.length) || fixedUnit;
    out.push({
      kind,
      value: text.replace(/\s+/g, '').replace(',', '.'),
      unit,
      unitStated: Boolean(written),
      // Only kinds with no notational unit can need one.
      needsUnit: !unit,
      text,
      at,
    });
  }
  return out;
}

// Ordered, so a reply lists readings the way the sentence did. One reading per kind: a
// person writing two pulses in one message is ambiguous, and the first is what they led
// with. Nothing is merged or averaged.
export function extractMeasurements(text: string): Measurement[] {
  const haystack = fold(typeof text === 'string' ? text.slice(0, MAX_READ_CHARS) : '');
  if (!haystack) return [];
  const pairs = reading('blood_pressure', haystack, /\d{2,3}\s*\/\s*\d{2,3}/g, 'mmHg');
  const found = [
    ...pairs,
    ...reading('pulse', haystack, /\b\d{2,3}\b/g, '/min'),
    ...reading('temperature', haystack, new RegExp(`\\b${NUMBER}\\b`, 'g'), ''),
    ...reading('weight', haystack, new RegExp(`\\b${NUMBER}\\b`, 'g'), ''),
    ...reading('glucose', haystack, new RegExp(`\\b${NUMBER}\\b`, 'g'), ''),
    ...reading('oxygen', haystack, /\b\d{2,3}\b/g, '%'),
  ];
  // A blood-pressure pair swallows two numbers; neither half may reappear as another kind.
  const inPair = (m: Measurement) => m.kind !== 'blood_pressure'
    && pairs.some(pair => m.at >= pair.at && m.at < pair.at + pair.text.length);
  const first = new Map<MeasurementKind, Measurement>();
  for (const m of found.filter(m => !inPair(m)).sort((a, b) => a.at - b.at)) {
    if (!first.has(m.kind)) first.set(m.kind, m);
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
  if (!haystack) return null;
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

// Exposed so tests and a reviewer can read exactly what is recognised.
export const vocabulary = { keywords: KEYWORDS, units: UNITS, implied: IMPLIED, times: TIME_PHRASES };
