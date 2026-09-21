'use client';
import {useActionState} from 'react';
import {saveCheckIn} from '../app/wellbeing-actions';
import {translations,type Locale} from '../lib/i18n';

// Short, optional, and correctable: every question can be left on "prefer not to say", and
// a correction is simply a new check-in, because a report is what was said at the time.
// If the deterministic screen matched the free text, the escalation replaces the ordinary
// acknowledgement rather than appearing next to it.
export function CheckInForm({patient,locale}:{patient:string;locale:Locale}){
 const t=translations[locale];
 const [state,action,pending]=useActionState(saveCheckIn,{message:''});
 const messages=t.checkInMessages as Record<string,string>;

 const group=(name:string,label:string,options:Array<[string,string]>)=>
  <fieldset style={{border:0,padding:0,marginBlock:16}}>
   <legend style={{fontSize:'1.05rem',marginBottom:8}}>{label}</legend>
   <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
    {/* Skipping is the default, so nothing is recorded unless the person chooses. */}
    <label className="choice"><input type="radio" name={name} value="" defaultChecked/> {t.checkInSkip}</label>
    {options.map(([value,text])=>
     <label className="choice" key={value}><input type="radio" name={name} value={value}/> {text}</label>)}
   </div>
  </fieldset>;

 return <form action={action} className="login-form">
  <input type="hidden" name="patient" value={patient}/><input type="hidden" name="locale" value={locale}/>
  {group('feeling',t.checkInFeeling,[['good',t.optionGood],['ok',t.optionOk],['poor',t.optionPoor]])}
  {group('energy',t.checkInEnergy,[['good',t.optionGood],['ok',t.optionOk],['low',t.optionLow]])}
  {group('appetite',t.checkInAppetite,[['good',t.optionGood],['ok',t.optionOk],['low',t.optionLow]])}
  {group('sleep',t.checkInSleep,[['good',t.optionGood],['ok',t.optionOk],['poor',t.optionPoor]])}
  {group('activity',t.checkInActivity,[['active',t.optionActive],['some',t.optionSome],['resting',t.optionResting]])}
  <label>{t.checkInNote}<textarea name="note" rows={3} maxLength={2000}/></label>
  <button className="button primary" disabled={pending}>{pending?t.checkInSaving:t.checkInSave}</button>
  <p role="status">
   {state.safety
    ? <strong>{t[state.safety]}</strong>
    : state.message?messages[state.message]??'':''}
  </p>
  {state.truncated&&<p className="tiny">{t.safetyTruncated}</p>}
  {state.safety&&<p className="tiny">{t.safetyWithheld}</p>}
 </form>;
}
