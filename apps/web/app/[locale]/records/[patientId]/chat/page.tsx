import { notFound } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { isLocale, translations, direction, fill, measurementLabel, formatTimestamp } from '../../../../../lib/i18n';
import { authorizedPatient } from '../../../../../lib/dal';
import { database } from '../../../../../lib/supabase';
import { backendConfigured } from '../../../../../lib/config';
import { assistantAvailable, assistantConfigured } from '../../../../../lib/assistant';
import { AccessMessage } from '../../../../../components/access-message';
import { LanguageLinks } from '../../../../../components/shell';
import { Conversation } from '../../../../../components/conversation';
import { loadConversation } from '../../../../conversation-actions';
import { signOut } from '../../../../actions';
import { APP_VERSION } from '../../../../../lib/version';
export const dynamic = 'force-dynamic';

// The main product screen. One conversation, one box, one attachment button, one Send, and
// a small language selector. Everything else - the record, documents, change history, the
// check-in form, user administration and signing out - lives behind the Menu, which is a
// plain <details> so it works before JavaScript loads and with a screen reader.

async function isAppAdmin() {
  try {
    const db = await database();
    const { data: { user }, error } = await db.auth.getUser();
    if (error || !user) return false;
    const result = await db.from('app_admins').select('user_id').eq('user_id', user.id).is('revoked_at', null).maybeSingle();
    return Boolean(result.data);
  } catch { return false; }
}

export default async function Chat({ params }: { params: Promise<{ locale: string; patientId: string }> }) {
  const { locale, patientId } = await params;
  if (!isLocale(locale) || !z.uuid().safeParse(patientId).success) notFound();
  if (!backendConfigured()) return <AccessMessage locale={locale} message="setup"/>;
  const t = translations[locale];

  let role: 'patient' | 'caregiver';
  try { ({ role } = await authorizedPatient(patientId, 'read_record')); }
  catch (error) {
    return <AccessMessage locale={locale} message={error instanceof Error && error.message === 'ACCESS_DENIED' ? 'denied' : 'unavailable'}/>;
  }

  const loaded = await loadConversation(patientId);
  if (!loaded.ok && loaded.reason === 'denied') return <AccessMessage locale={locale} message="denied"/>;
  // A read failure is shown inside the conversation rather than as a blank history: an
  // empty screen would suggest the app had forgotten what was said.
  const messages = loaded.ok ? loaded.messages : [];
  const confirmed = loaded.ok ? loaded.confirmed : [];
  const unprepared = !loaded.ok;

  const admin = await isAppAdmin();
  const base = `/${locale}/records/${patientId}`;
  const config = assistantConfigured();

  return <main className="page-content chat-screen" lang={locale} dir={direction(locale)}>
    <header className="chat-header">
      <h1>{t.chatTitle}</h1>
      <div className="chat-header-actions">
        <LanguageLinks locale={locale} path={`/records/${patientId}/chat`}/>
        <details className="chat-menu">
          <summary>{t.chatMenu}</summary>
          <div className="chat-menu-panel">
            <nav aria-label={t.chatMenu}>
              <Link href={base}>{t.homeRecord}</Link>
              <Link href={`${base}/checkin`}>{t.homeFeeling}</Link>
              {role === 'caregiver' && <Link href={`${base}/documents`}>{t.homeDocuments}</Link>}
              {role === 'caregiver' && <Link href={`${base}/history`}>{t.history}</Link>}
              {admin && <Link href={`/${locale}/admin`}>{t.manageUsers}</Link>}
            </nav>

            <section className="chat-memory">
              <h2>{t.memoryHeading}</h2>
              <p className="tiny">{t.memoryNote}</p>
              {confirmed.length === 0 ? <p className="tiny">{t.memoryNone}</p> : <ul>
                {confirmed.map(fact => <li key={fact.id} className="tiny">
                  {measurementLabel(locale, fact.kind)}:{' '}
                  <span dir="ltr">{fact.value}{fact.unit ? ` ${fact.unit}` : ''}</span>
                  {fact.reportedWhen ? ` · ${fact.reportedWhen}` : ''}
                  {' · '}<time dateTime={fact.createdAt} dir="ltr">{formatTimestamp(locale, fact.createdAt)}</time>
                </li>)}
              </ul>}
            </section>

            {/* Two different questions, answered separately, because conflating them once
                produced a false claim. Where the conversation is STORED is always the same
                answer - the family's private hosted record - and is stated whether or not a
                model service is switched on. Which company, if any, additionally RECEIVES
                it is the second sentence. Both answerable from the screen rather than from
                the source code. */}
            <p className="tiny">{t.privacyStorage}</p>
            <p className="tiny">{assistantAvailable() && config ? fill(t.aiOn, { recipient: config.recipient }) : t.aiOff}</p>
            <p className="tiny">{t.development} · {t.versionLabel} {APP_VERSION}</p>
            <form action={signOut}>
              <input type="hidden" name="locale" value={locale}/>
              <button className="text-link" type="submit">{t.signOut}</button>
            </form>
          </div>
        </details>
      </div>
    </header>

    <Conversation patient={patientId} locale={locale} initial={messages} unprepared={unprepared}/>
  </main>;
}
