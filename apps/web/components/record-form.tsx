'use client';
import { useActionState, useId, useState } from 'react';
import { saveRecord } from '../app/actions';
import { categories, provenances, type MedicalRecord, type Source } from '../../../packages/domain/record';
import { translations, type Locale } from '../lib/i18n';
import { Icon } from './icon';

export function RecordForm({ locale, patientId, record, source }: { locale: Locale; patientId: string; record?: MedicalRecord; source?: Source }) {
  const t = translations[locale]; const prefix = useId();
  const [state, action, pending] = useActionState(saveRecord, { status: 'idle' } as const);
  const [provenance, setProvenance] = useState(record?.provenance ?? 'REPORTED');
  const field = (name: string, label: string, value?: string | null, required = false, maxLength = 500) => <label htmlFor={`${prefix}-${name}`}>{label}<input id={`${prefix}-${name}`} name={name} defaultValue={value ?? ''} required={required} maxLength={maxLength}/></label>;
  return <details className="record-editor"><summary><Icon name={record ? 'record' : 'plus'} size={18}/>{record ? t.edit : t.add}</summary>
    <form action={action} className="edit-form">
      <input type="hidden" name="locale" value={locale}/><input type="hidden" name="patientId" value={patientId}/>
      <input type="hidden" name="recordId" value={record?.id ?? ''}/><input type="hidden" name="expectedVersion" value={record?.version ?? 0}/>
      <div className="form-grid"><label>{t.category}<select name="category" defaultValue={record?.category ?? 'profile'}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</select></label>
        {field('label', t.label, record?.label, true, 120)}
        <label>{t.provenance}<select name="provenance" value={provenance} onChange={event => setProvenance(event.target.value as typeof provenance)}>{provenances.map(p => <option key={p} value={p}>{t.provenanceLabels[p]}</option>)}</select></label>
        {provenance === 'UNKNOWN' ? field('unknownReason', t.unknownReason, record?.unknown_reason, true) : field('value', t.value, record?.value, true, 2000)}
        {field('unit', t.unit, record?.unit, false, 40)}
        {provenance === 'ESTIMATED' && field('derivation', t.derivation, record?.derivation, true)}
        {field('sourceDescription', t.sourceDescription, source?.description, true)}
        <label>{t.sourceDate}<input name="sourceDate" defaultValue={source?.source_date ?? 'UNKNOWN'} required maxLength={10} aria-describedby={`${prefix}-date-hint`}/><span id={`${prefix}-date-hint`} className="field-hint">{t.dateHint}</span></label>
      </div>
      <label className="checkbox"><input type="checkbox" name="hasConflict" defaultChecked={record?.has_conflict}/><span>{t.conflictLabel}</span></label>
      <label className="checkbox"><input type="checkbox" name="confirmed" required/><span>{t.confirmation}</span></label>
      {state.status !== 'idle' && <p role="status" className={`form-status ${state.status === 'saved' ? 'success' : 'error'}`}>{t[state.status]}</p>}
      <button className="button primary" type="submit" disabled={pending}>{pending ? t.saving : t.save}<Icon name="arrow" size={18}/></button>
    </form>
  </details>;
}
