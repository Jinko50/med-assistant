# Independent verification and final-release handoff

> RELEASE HOLD — NEW LIVE FAILURE: During this review the owner attempted a document
> upload and received a full-page "This page couldn't load / A server error occurred"
> at the documents route. This is a failed live acceptance test, not merely missing
> evidence. File size/type, exact installed version and console error have been requested.
> The user's app port is not listening on the review computer, so this reviewer cannot
> read the remote process logs or inspect that localhost URL directly. Do not finalize
> a release or claim uploads work until reproduced, repaired and retested.
>
> Investigation lead, NOT a diagnosis: Next's installed default proxyClientMaxBodySize
> is 10 MiB, the app accepts files up to 10 MiB and serverActions.bodySizeLimit is 12mb.
> Multipart overhead and pre-action parsing can fail outside uploadDocument's try/catch.
> There is no client file-size rejection or route error boundary. Inspect boundary-size
> behavior as well as ordinary small-file uploads; do not assume size caused this report.

20 September 2026. Requested by the owner after Claude's localization/release log.
Reviewed source: `c71fb3c95c84920d3d7ca73d63fbff833f306116` on main.
Application changes: `12779bb`; previous implementation baseline: `0899b95`.
The checkout was clean at review start. This review does not modify application code,
accounts, grants, data, historical safety evidence or published releases.

## Independently reproduced results

| Check | Result | Boundary |
|---|---|---|
| `npm test` | PASS, 22 tests | Includes translation/source checks, not authenticated page acceptance |
| `npm run test:database` | PASS, 19 tests | PGlite with simulated Auth/Storage schema |
| `npm run build` | PASS | Fresh production build of reviewed source |
| `npm run typecheck` | PASS | After production build |
| `npm audit --audit-level=high` | PASS, 0 vulnerabilities reported | Registry audit at review time |
| `python tools/check_consistency.py` | PASS, 52 checks | Static safety-document consistency only |
| Live backend checker | PASS | Auth reachable, email enabled, all 11 app tables deny anonymous reads |
| Downloaded release SHA256 | PASS | Matches GitHub digest and Claude's stated size |
| Extracted release manifest | PASS | All 1,360 listed file hashes match; connected mode; clinicalReady=false |
| Downloaded release portable smoke | PASS | Bundled runtime, login, anonymous admin/doc denial, preview disabled, RU/HE registration, language controls, Hebrew LTR email, version present |
| Core authorization comparison | PASS | No changes in lib/dal.ts, lib/admin.ts, packages/domain/access.ts or database files since 0899b95 |
| Existing GitHub CI | PASS | Runs 35538751544, 35538711185, 35538684115 |
| Clinical behavioral gate | BLOCKED, expected exit 1 | No release configuration/actual behavioral evidence supplied; no model tests executed |

`npm run test:e2e` also passed all 10 desktop/mobile checks in 24.1 seconds using installed
Chrome against the freshly built source. Typecheck and browser checks exited successfully.

The tested asset was downloaded independently from GitHub, not reused from Claude's local
build folder. Release: https://github.com/Jinko50/med-assistant/releases/tag/v0.4.0-localized-test.1

- File: `Med-Assistant-Windows-x64.zip`
- Size: 40,036,105 bytes
- SHA256: `bd967d1d40b2b22d6b76c1af31e4e9ce7f9b176e8273aa4f3cb2fb6b16e0b8d4`
- Manifest version: `0.4.0-localized-test.1`
- Review extraction: ignored `dist/independent review v040 extracted/Med-Assistant-Windows`

## Findings and remaining evidence

The implementation matches the principal localization and navigation claims in Claude's
log. Admin now derives locale/direction and has language links and member-only daily-use
buttons. Workspace prioritizes the member's record. No authorization regression was found
in the reviewed diff or executed checks. Automated tests alone do not prove every visible
string or every authenticated interaction works.

The critical unresolved test remains a real upload/finalize/download through Supabase
Storage followed by access from the other approved account on the other computer. Neither
the source inspection nor the anonymous checker proves this. The owner was asked to sign
in privately and perform this with a harmless sample; no passwords were requested. Record
the actual response before declaring this acceptance complete. Also verify authenticated
RU/HE admin and document screens, navigation, record editing/history and locale switching.

Do not revoke or alter either family administrator just for testing. Use isolated synthetic
identities/data for negative permission tests, with appropriate authorized access. Do not
create a session by bypassing email verification or using privileged impersonation.

Secondary items for Claude to review before final packaging:

- Packaging accepts `-Version`, while the UI version is compiled from
  `NEXT_PUBLIC_APP_VERSION`. The smoke test checks that a stamp exists, not equality with
  VERSION.txt/manifest/expected release. Add an exact agreement check to prevent a future
  package/UI mismatch. The tested manifest currently has the expected release version.
- Admin's audit list still displays raw event action codes and raw timestamps. Decide
  whether to translate/format these to meet the promise of a fully localized user flow.
- Unknown message keys render blank. A localized generic fallback would make a future
  mismatch visible rather than silently hide a failed operation. This is a robustness
  concern, not an observed failing user action in this review.
- Static checker still prints an inherited TOTAL EXECUTED figure of 28. Do not confuse
  that with the reconciled gating subset (22 of 29 IDs, 20 pass/2 fail/7 not run), or treat
  either historical count as execution of this standalone application.

## Owner's instruction to Claude

The owner wants Claude to make the final released version. Take over from this report and
AGENTS.md. Resolve material findings, obtain the missing authenticated acceptance evidence,
and perform final packaging/release. Preserve existing data, both admin/editor identities,
the six-character provider minimum, private storage, and earlier downloadable releases.
Keep secrets and personal data out of Git and release artifacts. Do not ask for passwords
in conversation. Use the existing authenticated development tooling when available.

Do not merely relabel the current prerelease as a completed medical assistant. Recovery,
backup/restore, operational and clinical gates remain open in STANDALONE_READINESS.md;
medical AI stays off. If a final limited record/document-management release is appropriate,
state that scope explicitly and retain the medical limitations. If user-dependent tests
remain unavailable, prepare the candidate and give the exact remaining acceptance steps;
do not invent results or mark the release fully ready.

Use the current configured Claude model, give the owner model guidance, and report the
actual model if known. Codex's recommendation for this verification remains GPT-6 Astra /
High, Extra High for security review; that is not a Claude model name.

## Additional owner report during verification

The owner supplied another screenshot of the old English-only administration screen,
without language controls, everyday-use buttons or a visible version. It matches the
pre-localization interface; the installed/running build has not been identified by its
version footer. Do not treat this as evidence of a failed v0.4 upload or a new localization
regression. The owner was given the exact v0.4 download and instructed to close the old
console/browser tab, extract into a new folder, start that folder's launcher, and confirm
the version on the login page. Old localhost bookmarks may point at an older running copy.

The owner also explicitly expects a place to CHAT. Chat does not exist in these builds.
That is missing product functionality, not an installation problem. Clearly state this
in the outcome and release scope; do not call a record/document-only candidate the finished
Med Assistant. Plan the remaining chat implementation behind the documented safety and
clinical gates rather than enabling an unrestricted medical chatbot.
