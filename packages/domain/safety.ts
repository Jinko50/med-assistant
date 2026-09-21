// Deterministic safety screen. Milestone 9 of the implementation plan, and the documented
// prerequisite for any generated health answer.
//
// This runs BEFORE any model call and never depends on one. It is pure: no network, no
// database, no clock. The same text always produces the same decision, so it can be tested
// exhaustively and reviewed by a clinician as a table rather than as model behaviour.
//
// Three honest limits, stated here because they must not be forgotten downstream:
//   1. `none` means NOTHING MATCHED. It does not mean the text is safe, and no caller may
//      present it as reassurance. A screen of fixed phrases cannot recognise every way a
//      person describes a dangerous symptom, in three languages, with typos.
//   2. It recognises wording, not clinical states. It cannot triage.
//   3. No threshold is invented. Numbers are never interpreted here; a reading is only
//      meaningful against a threshold recorded by the patient's own clinician.
// Recognition remains a residual risk and is listed as such in the readiness report.

export type SafetyLevel='emergency'|'urgent'|'medication'|'none';
export interface SafetyDecision{
 level:SafetyLevel;
 // Translation key for the localized response the caller must show.
 messageKey:'safetyEmergency'|'safetyUrgent'|'safetyMedication'|'';
 // The phrases that fired, for the audit trail. Never shown as a diagnosis.
 matched:string[];
 // True when the input was truncated before screening, so the caller can say so.
 truncated:boolean;
}

// Bounded input. A very long paste is screened on its first characters and reported as
// truncated rather than silently accepted or silently dropped.
export const MAX_SCREEN_CHARS=4000;

// Phrases are matched on a normalized string. Keep them lowercase and unpunctuated.
// Each list is reviewed as a unit; adding a language means adding to every list.
const EMERGENCY=[
 // English
 'chest pain','pain in my chest','crushing chest','pressure in my chest','tightness in my chest',
 'cant breathe','can not breathe','cannot breathe','trouble breathing','struggling to breathe','gasping',
 'unresponsive','wont wake up','will not wake up','passed out','fainted','collapsed',
 'face is drooping','face drooping','slurred speech','cant speak','one side is weak','weakness on one side',
 'numb on one side','sudden numbness','sudden weakness','cant move my arm','cant move my leg',
 'vomiting blood','coughing up blood','black stool','blood in my stool','bleeding that wont stop','heavy bleeding',
 'seizure','fitting','convulsion','suddenly confused','new confusion',
 'hit my head','banged my head','fell and hit my head','head injury',
 'lips are swelling','tongue is swelling','throat is closing','anaphylaxis',
 'worst headache','sudden severe headache','suicidal','kill myself','end my life',
 // Russian
 'боль в груди','болит в груди','давит в груди','сжимает в груди','жжение в груди',
 'не могу дышать','трудно дышать','тяжело дышать','задыхаюсь','нечем дышать',
 'без сознания','не приходит в себя','потерял сознание','потеряла сознание','упал в обморок','упала в обморок',
 'перекосило лицо','опустился угол рта','невнятная речь','не может говорить','не могу говорить',
 'онемела рука','онемела нога','онемение с одной стороны','слабость с одной стороны','отнялась рука','отнялась нога',
 'рвота с кровью','кашель с кровью','черный стул','чёрный стул','кровь в стуле','кровь не останавливается','сильное кровотечение',
 'судороги','припадок','внезапная спутанность','спутанность сознания',
 'ударился головой','ударилась головой','упал и ударился головой','упала и ударилась головой','травма головы',
 'отекают губы','отек языка','отёк языка','горло сжимается','анафилаксия',
 'самая сильная головная боль','внезапная сильная головная боль','покончить с собой','не хочу жить',
 // Hebrew
 'כאב בחזה','כאבים בחזה','לחץ בחזה','לוחץ לי בחזה',
 'לא יכול לנשום','לא יכולה לנשום','קשה לי לנשום','קוצר נשימה חמור','חנק',
 'מחוסר הכרה','מחוסרת הכרה','לא מתעורר','לא מתעוררת','התעלף','התעלפה','התמוטט','התמוטטה',
 'פנים נפולות','דיבור מעורפל','לא מצליח לדבר','חולשה בצד אחד','נימול בצד אחד','פתאום חלש',
 'הקאה עם דם','שיעול דם','צואה שחורה','דם בצואה','דימום שלא נפסק','דימום חזק',
 'פרכוס','התקף','בלבול פתאומי',
 'חבטה בראש','נפל על הראש','נפלה על הראש','פגיעת ראש',
 'שפתיים נפוחות','הלשון נפוחה','הגרון נסגר','אנפילקסיס',
 'כאב ראש חזק פתאומי','לשים סוף לחיי',
];

// Serious, but the documented response is same-day clinical contact rather than emergency
// services. Kept separate so the escalation wording can differ.
const URGENT=[
 'fever','high temperature','vomiting all day','cant keep water down','cannot keep water down',
 'diarrhoea all day','diarrhea all day','not passed urine','cannot urinate','swollen leg','calf pain',
 'rash spreading','wound looks infected','fell over','i fell','had a fall',
 'температура','жар','рвота весь день','не могу пить','не могу удержать воду',
 'понос весь день','не могу помочиться','нет мочи','опухла нога','боль в икре',
 'сыпь распространяется','рана воспалилась','я упал','я упала','было падение',
 'חום','הקאות כל היום','לא מצליח לשתות','שלשול כל היום','לא מצליח להשתין',
 'רגל נפוחה','כאב בשוק','פריחה מתפשטת','הפצע נראה מזוהם','נפלתי','הייתה נפילה',
];

// Any request to start, stop, change or double a medicine is routed to a person, never
// answered. This mirrors the withdrawn "hold" authority in the safety rules.
const MEDICATION=[
 'should i stop taking','should i take more','double the dose','increase the dose','decrease the dose',
 'stop my medication','skip my dose','skip a dose','missed my dose','missed a dose','forgot my pill',
 'change my medication','change the dose','take two','extra pill','extra tablet','took it twice',
 'какую дозу','увеличить дозу','уменьшить дозу','удвоить дозу','пропустить дозу','пропустила дозу','пропустил дозу',
 'забыла таблетку','забыл таблетку','перестать принимать','бросить таблетки','изменить дозу','выпила два раза','выпил два раза',
 'האם להפסיק','להגדיל את המינון','להקטין את המינון','לדלג על מנה','פספסתי מנה','שכחתי לקחת','לשנות מינון','לקחתי פעמיים',
];

// Words that cancel a match when they appear shortly before it.
const NEGATORS=[
 'no','not','without','never','denies','deny','havent','have not','hasnt','has not','dont','do not','didnt','did not','isnt','is not',
 'нет','не','без','никогда','отрицает',
 'לא','אין','בלי','מעולם',
];
// Words that place a match in the past rather than now.
const HISTORY=[
 'history of','used to','previously','in the past','years ago','last year','when i was','after the operation',
 'в прошлом','раньше','когда то','когда-то','много лет назад','в прошлом году','после операции','в анамнезе',
 'בעבר','פעם','לפני שנים','לפני שנה','בהיסטוריה','אחרי הניתוח',
];

// Normalizes so that punctuation, case, Hebrew niqqud and Cyrillic ё do not defeat a match.
export function normalize(text:string){
 return text
  .normalize('NFKD')
  .replace(/[֑-ׇ]/g,'')          // Hebrew points and cantillation
  .replace(/[̀-ͯ]/g,'')          // combining marks, including Russian stress
  .toLowerCase()
  .replace(/ё/g,'е')
  .replace(/['’`]/g,'')                    // can't -> cant
  .replace(/[^\p{L}\p{N}]+/gu,' ')         // any punctuation becomes a separator
  .trim();
}

// Hebrew attaches one-letter particles directly to the following word, so "שפתיים נפוחות"
// appears in real text as "השפתיים נפוחות" and, after "and", as "והשפתיים". Plain word-boundary
// matching misses both. Each Hebrew word in a phrase may therefore carry up to two of
// these prefixes. Latin and Cyrillic words keep strict boundaries.
const HEBREW_PREFIXES='והבלמשכ';
const patterns=new Map<string,RegExp>();
function phrasePattern(phrase:string){
 const cached=patterns.get(phrase);
 if(cached)return cached;
 const words=normalize(phrase).split(' ').filter(Boolean).map(word=>{
  const escaped=word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return /[\u0590-\u05FF]/.test(word)?`[${HEBREW_PREFIXES}]{0,2}${escaped}`:escaped;
 });
 const pattern=new RegExp(`(?:^| )${words.join(' ')}(?= |$)`,'u');
 patterns.set(phrase,pattern);
 return pattern;
}

function findPhrase(haystack:string,phrase:string){
 if(!normalize(phrase))return -1;
 const found=phrasePattern(phrase).exec(haystack);
 if(!found)return -1;
 // Point at the phrase itself, past the leading separator the pattern consumed.
 return found.index+(found[0].startsWith(' ')?1:0);
}

// A match is cancelled when a negator or a history marker sits within the preceding few
// words. "no chest pain" and "history of chest pain" must not escalate; "chest pain now"
// must. This is a heuristic, and it is the main reason `none` cannot mean `safe`.
const CANCEL_WINDOW_WORDS=5;
function cancelled(haystack:string,at:number){
 const before=haystack.slice(0,at).trim().split(' ').filter(Boolean);
 const window=before.slice(-CANCEL_WINDOW_WORDS).join(' ');
 if(!window)return false;
 const padded=` ${window} `;
 return [...NEGATORS,...HISTORY].some(marker=>padded.includes(` ${normalize(marker)} `));
}

function scan(haystack:string,phrases:string[]){
 const matched:string[]=[];
 for(const phrase of phrases){
  const at=findPhrase(haystack,phrase);
  if(at>=0&&!cancelled(haystack,at))matched.push(phrase);
 }
 return matched;
}

// Emergency wins over everything, then medication routing, then urgent. Order is fixed so
// that a message mentioning both a red flag and a dose question still escalates first.
export function screen(text:string):SafetyDecision{
 const raw=typeof text==='string'?text:'';
 const truncated=raw.length>MAX_SCREEN_CHARS;
 const haystack=normalize(raw.slice(0,MAX_SCREEN_CHARS));
 if(!haystack)return {level:'none',messageKey:'',matched:[],truncated};
 const emergency=scan(haystack,EMERGENCY);
 if(emergency.length)return {level:'emergency',messageKey:'safetyEmergency',matched:emergency,truncated};
 const medication=scan(haystack,MEDICATION);
 if(medication.length)return {level:'medication',messageKey:'safetyMedication',matched:medication,truncated};
 const urgent=scan(haystack,URGENT);
 if(urgent.length)return {level:'urgent',messageKey:'safetyUrgent',matched:urgent,truncated};
 return {level:'none',messageKey:'',matched:[],truncated};
}

// True when routine wellbeing content (food ideas, activity suggestions, general comfort)
// must be withheld in favour of the escalation message. Never inverted into "safe".
export function withholdsRoutineAdvice(decision:SafetyDecision){
 return decision.level!=='none';
}

// Exposed so tests and a clinical reviewer can see exactly what is screened for.
export const catalogue={emergency:EMERGENCY,urgent:URGENT,medication:MEDICATION,negators:NEGATORS,history:HISTORY};
