import Link from 'next/link';
import type { MedicalRecord, Source } from '../../../packages/domain/record';
import { translations, type Locale } from '../lib/i18n';
import { RecordForm } from './record-form';
import { Icon } from './icon';

export function RecordView({ locale, patient, records, sources, role, preview = false }: {
  locale: Locale; patient: { id: string; display_name: string }; records: MedicalRecord[]; sources: Source[];
  role: 'patient' | 'caregiver'; preview?: boolean;
}) {
  const t = translations[locale];
  const unresolved = records.filter(r => r.provenance === 'UNKNOWN' || r.has_conflict);
  const section = (category: MedicalRecord['category'], title: string, icon: string, description?: string) => {
    const items = records.filter(r => r.category === category);
    return <section className="record-section" id={category} key={category}>
      <div className="section-heading"><div className="section-title"><span className="section-icon"><Icon name={icon}/></span><h2>{title}</h2></div><span className="count">{items.length}</span></div>
      {description && <p className="section-description">{description}</p>}
      {!items.length ? <p className="empty">{category === 'care_plan' ? t.noPlan : t.nothing}</p> : <div className="record-list">{items.map(record => {
        const source = sources.find(s => s.id === record.source_id);
        return <article className="record-item" key={record.id}>
          <div className="record-row"><h3 dir="auto">{record.label}</h3><span className={`badge ${record.provenance === 'UNKNOWN' || record.has_conflict ? 'amber' : ''}`}>{record.has_conflict ? t.conflicts : t.provenanceLabels[record.provenance]}</span></div>
          <p className="record-value" dir="auto">{record.provenance === 'UNKNOWN' ? record.unknown_reason : <>{record.value}{record.unit && <span className="unit"> {record.unit}</span>}</>}</p>
          {record.derivation && <p className="source-line">{t.derivation}: <bdi>{record.derivation}</bdi></p>}
          <p className="source-line"><Icon name="record" size={14}/><span>{t.source}: <bdi>{source?.description ?? t.unknown}</bdi> <span className="source-divider">·</span> {t.sourceDate}: <bdi>{!source || source.source_date === 'UNKNOWN' ? t.dateUnknown : source.source_date}</bdi></span></p>
          {role === 'caregiver' && !preview && <RecordForm key={`${record.id}-${record.version}`} locale={locale} patientId={patient.id} record={record} source={source}/>}
        </article>;
      })}</div>}
    </section>;
  };
  return <>
    <div className="page-heading"><div><p className="eyebrow">{t.recordedFor} <span>—</span> {patient.display_name}</p><h1>{role === 'caregiver' ? t.caregiverTitle : t.hello}</h1><p className="intro">{role === 'caregiver' ? t.caregiverIntro : t.patientIntro}</p></div><div className="avatar" aria-hidden="true">M<span/></div></div>
    {role === 'patient' && <section className="assistant-card"><div className="assistant-copy"><span className="assistant-label"><Icon name="flower" size={19}/> MED ASSISTANT</span><h2>{t.assistantTitle}</h2><p>{t.assistantBody}</p><a className="button light" href="#records">{t.recordLink}<Icon name="arrow" size={18}/></a><span className="coming"><span/>{t.assistantBadge}</span></div><div className="botanical" aria-hidden="true"><span className="orbit one"/><span className="orbit two"/><span className="orbit three"/><span className="botanical-core"><Icon name="leaf" size={76}/></span><span className="botanical-caption">WITH YOU, AT YOUR PACE</span></div></section>}
    {role === 'caregiver' && <div className="stats"><div><Icon name="record"/><span>{t.known}</span><strong>{records.filter(r => r.provenance !== 'UNKNOWN').length}<small>{t.facts}</small></strong></div><div><Icon name="clock"/><span>{t.unknown}</span><strong>{records.filter(r => r.provenance === 'UNKNOWN').length}<small>{t.facts}</small></strong></div><div className="stat-warm"><Icon name="alert"/><span>{t.conflicts}</span><strong>{records.filter(r => r.has_conflict).length}<small>{t.facts}</small></strong></div></div>}
    <div className="content-grid" id="records"><div className="record-column">
      <div className="records-title"><h2>{t.records}</h2><span className="subtle">{records.length} {t.facts}</span></div>
      {role === 'caregiver' && !preview && <RecordForm locale={locale} patientId={patient.id}/>}
      {section('medication',t.medicines,'pill',t.recordedOnly)}
      {section('care_plan',t.care,'heart')}
      {section('lab',t.categories.lab,'record')}
      {section('profile',t.profile,'record')}
      {(['allergy','condition','observation','note'] as const).filter(c => records.some(r => r.category === c)).map(c => section(c,t.categories[c],'record'))}
    </div><aside className="right-column">
      <section className="clarify-card"><span className="small-label"><span className="status-dot"/>{t.pending}</span><h2>{t.conflicts}</h2><p>{t.pendingNote}</p>{unresolved.length ? unresolved.map(r => <div className="clarify-item" key={r.id}><span className="small-circle">!</span><div><strong>{r.label}</strong><span>{r.has_conflict ? t.conflicts : t.unknown}</span></div></div>) : <p>{t.nothing}</p>}</section>
      <section className="timeline-card" id="timeline"><div className="section-title"><Icon name="clock"/><h2>{t.timeline}</h2></div>{records.filter(r => r.category === 'timeline').map(r => <div className="timeline-item" key={r.id}><span className="timeline-dot"/><p className="tiny">{sources.find(s => s.id === r.source_id)?.source_date ?? t.dateUnknown}</p><h3>{r.label}</h3><p>{r.value ?? r.unknown_reason}</p></div>)}{!records.some(r => r.category === 'timeline') && <p className="empty">{t.nothing}</p>}</section>
      {!preview && <Link className="history-link" href={`/${locale}/records/${patient.id}/history`}><Icon name="clock"/>{t.history}<Icon name="arrow" size={18}/></Link>}
      <div className="emergency-note"><Icon name="alert" size={20}/><div><strong>{t.emergency}</strong><p>{t.emergencyDetail}</p></div></div>
    </aside></div>
  </>;
}
