import test from 'node:test';
import assert from 'node:assert/strict';
import { screen, withholdsRoutineAdvice, normalize, catalogue, MAX_SCREEN_CHARS } from '../../packages/domain/safety.ts';
import { locales, translations } from '../../apps/web/lib/i18n.ts';

// Milestone 9. Every case is synthetic text; no real patient wording is used.
// The screen is deterministic, so these are truth-table assertions, not samples.

const emergencies = [
  ['en', 'I have bad chest pain right now'],
  ['en', "She collapsed and won't wake up"],
  ['en', 'my lips are swelling and my throat is closing'],
  ['en', 'he fell and hit my head yesterday on warfarin'],
  ['ru', 'У меня сильная боль в груди'],
  ['ru', 'Она без сознания, не приходит в себя'],
  ['ru', 'Рвота с кровью, чёрный стул'],
  ['ru', 'Я упала и ударилась головой'],
  ['he', 'יש לי כאב בחזה עכשיו'],
  ['he', 'היא מחוסרת הכרה ולא מתעוררת'],
  ['he', 'השפתיים נפוחות והגרון נסגר'],
  ['he', 'נפלתי וחבטה בראש'],
] as const;

test('red flags escalate in every language', () => {
  for (const [locale, text] of emergencies) {
    const decision = screen(text);
    assert.equal(decision.level, 'emergency', `${locale}: "${text}" must escalate`);
    assert.equal(decision.messageKey, 'safetyEmergency');
    assert.ok(decision.matched.length > 0, 'the matched phrase must be recorded for audit');
    assert.equal(withholdsRoutineAdvice(decision), true, 'routine advice must be withheld');
  }
});

test('negation does not escalate', () => {
  const negated = [
    'I have no chest pain today',
    'no trouble breathing, just tired',
    'У меня нет боли в груди',
    'не могу сказать что трудно дышать',
    'אין לי כאב בחזה',
    'לא כאב בחזה היום',
  ];
  for (const text of negated) {
    assert.equal(screen(text).level, 'none', `"${text}" must not escalate on a negated phrase`);
  }
});

test('a symptom placed in the past does not escalate as if it were now', () => {
  for (const text of [
    'history of chest pain, feeling fine today',
    'I used to have trouble breathing years ago',
    'в прошлом была боль в груди',
    'раньше было трудно дышать',
    'בעבר היה לי כאב בחזה',
  ]) {
    assert.equal(screen(text).level, 'none', `"${text}" is history, not a current emergency`);
  }
});

test('present-tense red flags still fire after an unrelated negation', () => {
  // The cancel window is short on purpose: a negation far earlier in the sentence must not
  // silence a later red flag.
  const decision = screen('I have no appetite at all and also I have bad chest pain');
  assert.equal(decision.level, 'emergency');
});

test('punctuation, capitals, apostrophes and Hebrew points do not defeat the screen', () => {
  for (const text of ['CHEST PAIN!!!', "I can't breathe.", 'Chest-pain, sudden.', 'כְּאֵב בֶּחָזֶה']) {
    assert.equal(screen(text).level, 'emergency', `"${text}" must still be recognised`);
  }
  assert.equal(normalize('Ёлка,  ЧЁРНЫЙ  стул!'), 'елка черныи стул');
});

test('a medication change request is routed to a person, never answered', () => {
  for (const text of [
    'should I stop taking my blood thinner',
    'I missed a dose, should I take two',
    'Можно увеличить дозу?',
    'Я пропустила дозу, что делать',
    'האם להפסיק את התרופה',
  ]) {
    const decision = screen(text);
    assert.equal(decision.level, 'medication', `"${text}" must route to a person`);
    assert.equal(decision.messageKey, 'safetyMedication');
    assert.equal(withholdsRoutineAdvice(decision), true);
  }
});

test('an emergency outranks a medication question in the same message', () => {
  const decision = screen('I have chest pain, should I take two of my pills?');
  assert.equal(decision.level, 'emergency', 'the red flag must win');
});

test('urgent-but-not-emergency wording is separated from emergencies', () => {
  for (const text of ['I have a fever today', 'у меня температура', 'יש לי חום']) {
    const decision = screen(text);
    assert.equal(decision.level, 'urgent', `"${text}" is same-day, not ambulance`);
    assert.equal(decision.messageKey, 'safetyUrgent');
  }
});

test('ordinary wellbeing text does not escalate, and is never called safe', () => {
  for (const text of ['I slept well and had soup for lunch', 'Сегодня хорошо спала, ела суп', 'ישנתי טוב ואכלתי מרק']) {
    const decision = screen(text);
    assert.equal(decision.level, 'none');
    assert.equal(decision.messageKey, '', 'no message means nothing matched, not that it is safe');
    assert.equal(withholdsRoutineAdvice(decision), false);
  }
});

test('empty and non-string input fail closed to no match without throwing', () => {
  for (const value of ['', '   ', null, undefined, 42, {}] as unknown[]) {
    const decision = screen(value as string);
    assert.equal(decision.level, 'none');
    assert.equal(decision.matched.length, 0);
  }
});

test('over-long input is screened and reported as truncated, not dropped', () => {
  const padded = 'a '.repeat(MAX_SCREEN_CHARS) + ' chest pain';
  const decision = screen(padded);
  assert.equal(decision.truncated, true, 'the caller must be able to say the text was cut');
  // The red flag sits beyond the bound, so it is NOT found: that is exactly why truncation
  // has to be surfaced rather than treated as a clean screen.
  assert.equal(decision.level, 'none');
  const short = screen('chest pain ' + 'a '.repeat(10));
  assert.equal(short.truncated, false);
  assert.equal(short.level, 'emergency');
});

test('no number is ever interpreted as a threshold', () => {
  // A reading only means something against a threshold recorded by the patient's clinician.
  for (const text of ['my blood pressure is 210 over 130', 'сахар 45', 'הדופק 38']) {
    assert.equal(screen(text).level, 'none',
      'the screen must not invent a clinical threshold from a bare number');
  }
});

test('the catalogue covers all three languages in every category', () => {
  const cyrillic = /[Ѐ-ӿ]/, hebrew = /[֐-׿]/, latin = /[a-z]/;
  for (const category of ['emergency', 'urgent', 'medication'] as const) {
    const list = catalogue[category];
    assert.ok(list.length > 0, `${category} is empty`);
    for (const [name, pattern] of [['English', latin], ['Russian', cyrillic], ['Hebrew', hebrew]] as const) {
      assert.ok(list.some(phrase => pattern.test(phrase)), `${category} has no ${name} phrases`);
    }
  }
});

test('every escalation has a localized response in all three languages', () => {
  for (const locale of locales) {
    for (const key of ['safetyEmergency', 'safetyUrgent', 'safetyMedication'] as const) {
      const value = translations[locale][key];
      assert.equal(typeof value, 'string', `${locale}.${key} is missing`);
      assert.ok(value.length > 0, `${locale}.${key} is empty`);
      if (locale !== 'en') {
        assert.notEqual(value, translations.en[key], `${locale}.${key} is still English`);
      }
    }
    // The app must never claim it can summon help itself.
    assert.ok(!/we will call|мы вызовем|אנחנו נתקשר/i.test(translations[locale].safetyEmergency),
      `${locale} must not imply the app contacts emergency services`);
  }
});

test('the screen is pure: same input, same decision, no side effects', () => {
  const text = 'chest pain and a fever';
  const first = screen(text), second = screen(text);
  assert.deepEqual(first, second);
  assert.equal(first.level, 'emergency');
});
