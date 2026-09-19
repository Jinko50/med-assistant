import type { MedicalRecord, Source } from '../../../packages/domain/record';
import { translations, type Locale } from './i18n';

// Public, read-only synthetic examples. Never load actual records into preview routes.
export function fictional(locale: Locale) {
  const text = {
    en: ['Levothyroxine (Euthyrox)', '50 mcg · recorded prescription', 'Potassium recheck', 'Clinic plan: recheck potassium and creatinine on 2026-09-29.', 'Vitamin B12', 'The value on the fictional report could not be read.', 'Furosemide strength', 'Discharge letter says 20 mg; box says 40 mg. Unresolved.', 'Preferred language', 'Russian', 'Clinic visit', 'A follow-up plan was recorded.', 'Prescription photograph', 'Clinic note', 'Lab report', 'Family report'],
    ru: ['Левотироксин (Эутирокс)', '50 мкг · записанное назначение', 'Повторный анализ калия', 'План клиники: повторить калий и креатинин 2026-09-29.', 'Витамин B12', 'Значение в вымышленном анализе не удалось прочитать.', 'Дозировка фуросемида', 'В выписке 20 мг, на коробке 40 мг. Противоречие не разрешено.', 'Предпочитаемый язык', 'Русский', 'Приём в клинике', 'Записан план последующего наблюдения.', 'Фото назначения', 'Запись клиники', 'Лабораторный отчёт', 'Со слов близких'],
    he: ['לבותירוקסין (Euthyrox)', '50 מק״ג · מרשם מתועד', 'בדיקת אשלגן חוזרת', 'תוכנית המרפאה: בדיקת אשלגן וקריאטינין ב-2026-09-29.', 'ויטמין B12', 'לא ניתן היה לקרוא את הערך בדוח הבדיוני.', 'חוזק פורוסמיד', 'במכתב השחרור 20 מ״ג; על הקופסה 40 מ״ג. הסתירה לא נפתרה.', 'שפה מועדפת', 'רוסית', 'ביקור במרפאה', 'תועדה תוכנית מעקב.', 'צילום מרשם', 'רישום מרפאה', 'דוח מעבדה', 'דיווח משפחתי'],
  }[locale];
  const sources: Source[] = [{ id: 's1', description: text[12], source_date: '2026-05-14' },{ id: 's2', description: text[13], source_date: '2026-09-15' },{ id: 's3', description: text[14], source_date: '2026-06-02' },{ id: 's4', description: text[15], source_date: '2026-09-08' }];
  const make = (id: string, category: MedicalRecord['category'], label: string, value: string | null, source_id: string, extras: Partial<MedicalRecord> = {}): MedicalRecord => ({ id, patient_id: 'fictional', category, label, value, source_id, unit: null, provenance: 'DOCUMENTED', unknown_reason: null, derivation: null, has_conflict: false, version: 1, updated_at: '2026-09-19T00:00:00Z', confirmed_by: 'fictional-caregiver', ...extras });
  return { patient: { id: 'fictional', display_name: translations[locale].fictionalName }, sources, records: [
    make('1','medication',text[0],text[1],'s1'), make('2','care_plan',text[2],text[3],'s2'),
    make('3','lab',text[4],null,'s3',{ provenance: 'UNKNOWN', unknown_reason: text[5] }),
    make('4','medication',text[6],text[7],'s4',{ provenance: 'REPORTED', has_conflict: true }),
    make('5','profile',text[8],text[9],'s4',{ provenance: 'REPORTED' }), make('6','timeline',text[10],text[11],'s2'),
  ] };
}
