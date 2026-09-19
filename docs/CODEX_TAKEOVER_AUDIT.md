# Codex takeover audit — 2026-09-19

Scope: working tree at commit 43de4c7, including existing uncommitted prompt edit and two fictional fixtures. This is an engineering audit, not clinical approval. The user's standalone mandate supersedes the old Phase 1 prohibition on building software. Existing clinical boundaries remain requirements; draft pathways remain unapproved.

## A. Repository inventory

The actual Git root is med-assistant/, one directory below the supplied workspace. No AGENTS.md was found in the workspace. At takeover there were 50 tracked files and two untracked fixtures, no dependency manifest, application source, database migration, deployment configuration or CI.

| Location | Purpose |
|---|---|
| README.md | Prototype introduction, setup links, safety warning; execution claims stale |
| SETUP_CHATGPT_PROJECT.md | Manual Project installation, prompt substitution, context uploads and validation |
| IMPLEMENTATION_DECISIONS.md | D-01–D-42, including withdrawn decisions; preserve as history |
| docs/PRODUCT_SPEC.md | Explicitly reconstructed requirements, old Phase 1 scope |
| docs/FUTURE_ARCHITECTURE.md | Conceptual Phase 2 design, no implemented components |
| docs/SAFETY_RULES.md | Normative emergency, medication, provenance, privacy and capability boundaries |
| docs/EMERGENCY_FALLBACKS.md | Unapproved pathways and clinical sign-off sheet; not runtime instructions |
| docs/CLINICAL_SOURCES.md | Source URLs, retrieval dates and clinical rationale; not independent clinical validation |
| docs/QUESTION_ENGINE.md | Question budgets, suppression, safety exceptions and worked examples |
| docs/PRIVACY.md | Consumer-Project disclosure, consent and household privacy risks |
| docs/OPEN_SAFETY_ISSUES.md | Clinical blockers, platform limitations, closed defects |
| project/MED_ASSISTANT_SYSTEM_PROMPT.md | Part A resident rules; Part B supplementary model instructions |
| project/*.template.md | Seven blank forms plus explicitly fictional examples; field mapping below |
| tests/*_cases.md | Eight scenario documents, 79 parent scenario IDs |
| tests/README.md | Scoring and suite inventory; stale zero-execution claims |
| tests/EXECUTION_LOG.md | Preserved observed Project outputs, configuration and verdicts |
| tests/fixtures/ | Seven populated fictional records, Part B copy, injection letter and pasted snapshot |
| tools/check_consistency.py | Static document checks; not medical behavior tests |
| tools/measure_prompt.py | Counts prompt sections; no model calls |
| review_package/ | Eight duplicated source documents plus README and clinician/pharmacist packet |
| .gitignore | Filled-file and photo/PDF exclusions; lacked environment/build exclusions |

Review copies are SAFETY_RULES, QUESTION_ENGINE, CLINICAL_SOURCES, OPEN_SAFETY_ISSUES, EMERGENCY_FALLBACKS, MED_ASSISTANT_SYSTEM_PROMPT, IMPLEMENTATION_DECISIONS and EXECUTION_LOG. They are secondary copies, not independently maintained requirements.

## B. What Claude Code already implemented

Actual executable implementation: two Python static utilities. Actual delivered assets: prompts, seven templates, fictional data, 79 prose scenarios, clinical review materials, and a log containing observed model responses. Git history records successive safety corrections and a live Project run. There is no evidence of a standalone runtime. Expected answers and claimed verdicts must not be treated as executable tests or independent clinical review.

## C. Reusable assets

Preserve all safety rules, withdrawn-decision history, source references, question budgets, language and accessibility requirements, template fields, fictional cases and observed outputs. Translate them into contracts and tests with traceability. Keep DOCUMENTED distinct from human confirmation: confirmation means accepted into the record, not clinically proven true. Retain source snapshots and immutable correction history.

## D. Project-specific material

Prompt-length reduction, resident versus uploaded prompt placement, Project setup, manual copy/paste updates and pasted retrieval snapshots become migration/prototype material. Model memory must not be storage. Capability statements need measured adaptation: the new application may save only after a successful authorized transaction; notification/monitoring promises remain prohibited until those features actually exist. No inference of identity from conversational language.

## E. Safety requirement map

All rows currently depend on model behavior in the prototype; no deterministic medical engine exists at takeover.

| Requirement | Existing source | Existing scenarios / future enforcement |
|---|---|---|
| Emergency first; no lookup/question delay | SAFETY_RULES §§1–2; prompt A1; D-40 | REG-05/06, SYM-02; pre-model routing and locally available verified emergency configuration |
| Unresponsive; CPR only with absent/abnormal breathing | SAFETY_RULES §2.3; prompt A1 | REG-05a, REG-13a/b; explicit conjunction, unknown breathing distinct |
| Stroke | SAFETY_RULES §§2.2–2.3 | SAFE-05; emergency override |
| Severe breathing difficulty / chest pain | SAFETY_RULES §2.2 | REG-06/13a, SYM-02/06; emergency override without inappropriate CPR |
| Severe/uncontrolled bleeding | SAFETY_RULES §2.2 | REG-05 family; add dedicated multilingual cases |
| Vomiting blood / black tarry stool | SAFETY_RULES §2.2 | SAFE-04; override casual framing |
| Seizure / new confusion | SAFETY_RULES §2.2 | SYM-04; add dedicated seizure cases |
| Head strike on anticoagulant/antiplatelet including aspirin | SAFETY_RULES §2.5; B-07 | REG-19, SYM-03; no aspirin exclusion or wait window |
| Suspected anaphylaxis | SAFETY_RULES §§2.2–2.3, 3.2a | REG-05; owned prescribed rescue plan only |
| Severe hypo with confusion/seizure/unsafe swallowing | SAFETY_RULES §§2.3–2.6 | REG-05/18a; no invented amounts or thresholds |
| No medication changes; missed/late/extra/duplicate/uncertain dose rules | SAFETY_RULES §§3.2–3.3; D-19/20/41 | REG-01–04/17, SAFE-01/02, MED suite; fixed routing, protected read-back |
| No invention or appearance identification | SAFETY_RULES §§1,5; prompt A1 | REG-08, SAFE-06/07, DOC suite; structured unknowns and source validation |
| Recorded versus unrecorded; reconciliation; conflicts | SAFETY_RULES §§3.6,5; seven templates | REG-15/18, SAFE-01; separate facts, intake, provenance, conflicts |
| Patient access and caregiver authorization | SAFETY_RULES §7; PRIVACY; FAMILY_NOTES | REG-12, SAFE-03/09; authenticated relationship and server checks |
| Honest capabilities / pending writes | SAFETY_RULES §§5.4,6 | REG-09/14/17, SAFE-10; transaction outcome controls messaging |
| Low question burden | QUESTION_ENGINE §§1–4 | QF suite, REG-16; stored suppression plus emergency exception |

Residual risk: free-text emergency recognition, negation, temporality, translations, voice transcription, extraction accuracy and generated explanations cannot be guaranteed by a keyword list or a prompt. Deterministic rules need explicit input contracts and adversarial language testing; an unmatched input must never be labelled medically safe. Existing clinical sources were inventoried, not revalidated clinically in this audit.

## F. Test inventory and measured baseline

| File | Parent scenarios | Automated clinical execution at takeover |
|---|---:|---|
| regression_cases.md | 19 | None |
| safety_cases.md | 10 | None |
| medication_cases.md | 10 | None |
| symptom_cases.md | 8 | None |
| document_cases.md | 8 | None |
| food_cases.md | 10 | None |
| multilingual_cases.md | 6 | None |
| question_fatigue_cases.md | 8 | None |
| Total | 79 | Prose suite; selected manual outputs preserved separately |

All 29 REG/SAFE parent IDs gate readiness. Subparts require separate coverage: REG-05 a–d, REG-13 a–b, REG-18 a–b, totaling 34 gating inputs. Multi-turn/image cases also require their setup, not just a single text prompt.

The historical log summary claims 23 executed IDs / 21 passed / 2 failed / 6 not run / 28 inputs. Its own final table instead contains **22 executed parent IDs: 20 PASS, 2 FAIL, 7 NOT RUN** (REG-08/11/15/16, SAFE-02/08/09). This corresponds to 27 distinct executed subcases plus a repeat of REG-05a, plausibly explaining 28 executions; the historical summary is not authoritative arithmetic. REG-17 and SAFE-01 remain failures. Prior PASS judgments also need review: REG-03's output includes an extra-dose direction despite the absolute boundary. Do not silently re-score or replace the original evidence.

Executed at takeover with bundled Python: check_consistency = **51 PASS / 1 FAIL** (review-package prompt drift). measure_prompt: **Part A 6,737**, A1 4,961, A2 1,774; Part B 4,179 characters. Historical tested prompt was 6,700 characters after the fix: current text is not that tested artifact. Native python was absent from PATH; Node 24.16.0 and npm 11.13.0 are available.

## G. Data-model inventory

| Existing form | Proposed relational entities and constraints |
|---|---|
| PATIENT_PROFILE | Patient, ProfileFact, CommunicationPreference, DeviceUnit, EmergencyConfiguration, RescuePlan, CareContact |
| CURRENT_MEDICATIONS | MedicationProduct, PrescriptionFact, Reconciliation, AdministrationNote, MedicationConflict; intake separate |
| MEDICAL_HISTORY | Condition, Procedure, Admission, AllergyReaction (allergy/intolerance distinct), Device, Vaccination, SocialHistory |
| LAB_RESULTS | LabResult, SourceDocument, ReferenceRange, Trend; exact printed units; unreadable = explicit UNKNOWN reason |
| HEALTH_TIMELINE | TimelineEvent, Observation, IntakeReport; append-only corrections referencing original |
| CARE_PLAN | CarePlanEntry, Threshold, DeteriorationTrigger, MonitoringTask, Appointment, OpenItem; clinician source required for threshold |
| FAMILY_NOTES | CaregiverNote, PatientPreference, Contact; default patient-visible; privacy scope explicit and authorized |
| Pending blocks and document extraction | Document, ExtractionAttempt, CandidateFact, ReviewDecision, ConfirmedFactRevision, Conflict |
| No existing equivalent | User → PatientAccess → Patient; session identity separate; AuditEvent, Consent, AccessInvitation |

Every medical revision needs value or explicit unknown reason, provenance enum (DOCUMENTED / REPORTED / SEEN IN PHOTO / ESTIMATED / UNKNOWN), source identifier, source date with precision or explicit unknown, timestamps, author/reviewer, document/page link where applicable. Acceptance state is independent of provenance. ESTIMATED requires derivation and cannot fill safety-relevant unknowns. Preserve partial dates, original units, conflicting records and document originals; do not fabricate dates during import. Tenant/patient IDs must match across sources, candidates, revisions and audit events using database constraints. Transactional review uses expected version and appends history. Revocation is checked on every request, not just login.

## H. Current application implementation

At takeover: **no frontend, backend, database, authentication, authorization, ingestion, model API, monitoring, backup or deployed application**. The two Python scripts do not implement these. Initial TypeScript code added after this audit is described separately in STANDALONE_READINESS.md; it does not change this baseline finding.

## I. Technical debt and contradictions

1. README, test README, scenario banners, product spec, safety intro and review packet say no execution despite populated log. Old results tables are blank templates, not current status.
2. Seven unrun IDs are called six; aggregate counts are inconsistent (see F).
3. B-09 is referenced repeatedly but has no dedicated issue entry.
4. Review prompt drift corresponds to a pre-existing uncommitted edit; preserve it and explicitly refresh the review copy without claiming re-execution.
5. Safety §2.1 and worked examples still source emergency number from a file; D-40 correctly moved it into resident configuration. Standalone must not wait on DB retrieval before generic emergency escalation.
6. CARE_PLAN fictional standing instruction says head injury → same-day ED while normative rule says emergency services now; its deterioration table also broadens to any fall. Migration must retain and flag this conflict, never quietly weaken the emergency floor.
7. QUESTION_ENGINE Example 3 includes a medication direction; Example 7 claims it names the checked medicine but does not. Preserve and flag for clinical review.
8. Reconstructed spec's zero-cost/no-app restrictions and FUTURE_ARCHITECTURE's do-not-build language are superseded by this handoff. Earlier broad automatic write-back and family-alert claims need approval workflow and honest delivery semantics.
9. Static link checker passes at baseline, but skips review copies, does not inspect all Markdown links/anchors, and substitutes fixture/template paths for upload names. Review package explicitly has nonportable references. No exhaustive broken-link assurance.
10. Review package is described as four copies in README, but contains ten files. Fixture dates include partial dates; full-date-only import would lose meaning.
11. Prompt fixtures / copied Part B can drift; executable behavior results must bind to actual app, policy, model and dataset versions.

## J. Security/privacy findings

Working-tree inventory contains no environment files, private keys, auth code, database dumps or upload storage. Obvious credential-pattern scan is recorded in the baseline evidence; absence of hits is not proof of no secrets. Fictional records and masked phone placeholders are explicitly labelled; the clinician packet says the fictional case is modelled on a real case, so re-identification risk still warrants human review before wider distribution. Do not publish the packet as an anonymization guarantee.

The log contains a Project identifier and observed medical-test conversations. It is not a credential, but should not be forwarded unnecessarily. The ignore file originally excluded only specific filled files and common images/PDFs: arbitrarily named patient text, exports and secrets could still be committed. Ignore rules are defense in depth, not access control or a scanner. There is no secure logging, session, tenancy, upload or retention implementation yet. Historical Git content has not undergone a specialist secret/data-loss scan. No formal regulatory compliance is claimed; legal basis, consent, processors, region, retention, access/export/deletion and applicable law need assessment.

## K. Recommended stack and tradeoffs

Use TypeScript and Next.js App Router as one responsive web application with server endpoints and a centralized server-only data-access layer. Use managed PostgreSQL, Supabase Auth and private Supabase Storage, with versioned SQL migrations and row-level policies as defense in depth. Keep privileged storage/database credentials off the browser; caregiver privileges come from PatientAccess, never user-editable token metadata. Use Zod at API boundaries, Node unit tests initially, database integration tests and Playwright for user flows. Use a server provider adapter with bounded context, timeouts and structured responses. Add a durable database-backed ingestion job only when needed, not a fleet of microservices.

Tradeoffs: managed auth/storage reduce family operational burden but introduce cost, vendor/region dependencies and provider backup limitations. PostgreSQL and SQL migrations preserve portability. Next.js needs careful route/action authorization and cache isolation. Private storage still needs explicit access policies. Region, processor terms and deployment choice remain decisions before real data. Do not claim free-tier suitability or compliance.

Architecture references checked 2026-09-19: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication), [data security](https://nextjs.org/docs/app/guides/data-security), [Postgres RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [storage access control](https://supabase.com/docs/guides/storage/security/access-control). Exact package versions will be pinned and scanned when scaffolding, not guessed now.

## L. Target architecture and proposed layout

```text
Patient UI (RU/HE/EN, RTL, large targets)   Caregiver UI (review/records)
                   \                       /
                     HTTPS Next.js server
                     session verification
                     PatientAccess authorization
                              |
              deterministic safety pre-check ----------> emergency response
                              |
              confirmed relevant context + provenance
                              |
                   provider adapter -> response guards -> response
                              |
             PostgreSQL revisions/conflicts/audit (RLS)

Caregiver upload -> private quarantine -> extraction -> pending candidates
  -> authorized review transaction -> confirmed revisions + audit
Original documents remain linked; model has no confirmed-record write tool.
```

Proposed directories: apps/web (patient/caregiver routes, API and server DAL); packages/domain (authorization, facts, safety, review contracts); packages/ai (provider/context/guards); database/migrations; tools (migration/evidence); tests/unit, integration, e2e, behavioral; existing project, docs, review_package remain. CI runs local checks; deployment also requires reviewed behavioral evidence and readiness blockers to be closed. No medical context in service-worker caches, request logs or analytics.

## M. Migration classification

| Existing artifact (all members covered) | Classification → new role |
|---|---|
| SAFETY_RULES | runtime requirement; safety-engine rule; model instruction; automated test source |
| QUESTION_ENGINE | runtime requirement; model instruction; automated test source |
| EMERGENCY_FALLBACKS | documentation only until signed clinical approval; never ingest as active policy |
| CLINICAL_SOURCES | documentation; safety-rule provenance |
| OPEN_SAFETY_ISSUES | documentation; release review input |
| PRODUCT_SPEC / PRIVACY | runtime requirement + documentation, with obsolete Project assumptions clearly scoped |
| FUTURE_ARCHITECTURE | migration-only artifact; historical design rationale |
| MED_ASSISTANT_SYSTEM_PROMPT A/B | model instruction and safety-engine rule input; Project installation wrapper obsolete after migration |
| All seven project templates | database/schema input; migration-only source forms; fictional examples automated test data |
| All eight *_cases documents | automated test source; retain prose acceptance criteria and subcases |
| Seven fixture records | automated test fixtures + migration test input, never production seed |
| Fixture MED_ASSISTANT_PART_B | automated test/model instruction reference; superseded by versioned server prompt |
| REG11 injection letter | automated adversarial test fixture, never instruction |
| SNAPSHOT_for_pasting | migration-only artifact for prototype retrieval workaround |
| tests/EXECUTION_LOG | documentation / historical behavioral evidence, not current app certification |
| tests/README | documentation / scoring contract |
| Both tools/*.py | automated static tests/tooling; prompt measurement secondary after migration |
| README / IMPLEMENTATION_DECISIONS / .gitignore | documentation / architectural history / repository protection |
| SETUP_CHATGPT_PROJECT | migration-only artifact; obsolete as application setup after migration |
| Eight review copies | documentation snapshots; refresh explicitly, retain Git history |
| Review README / CLINICIAN_PHARMACIST_PACKET | documentation and human review workflow input |

No old artifact is to be deleted merely because its runtime role ends. Import proposes candidates with original text/source hashes, dry-run reports and human confirmation. It must not auto-resolve medication conflicts or treat fictional examples as real records.

## N. Controlled-pilot release blockers

No running standalone app or secure persistence exists. Identity/session/revocation, relationship authorization, ingestion/review, protected retrieval, deterministic emergency handling, multilingual/accessibility/voice verification, real model regressions, deployment/monitoring, backup/restore/rollback and incident handling are absent. Clinical/pharmacy/local protocol approval remains absent. Two historical gate failures and seven unrun parent cases block even the prototype. All standalone behavioral cases must run against the actual deployed candidate. Dependency outages must fail visibly without guessing. Formal privacy/compliance assessment remains open. A rendered MVP, static checks, unit passes or passing a subset of old model tests cannot establish pilot readiness.
