#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Local consistency checks for the Med Assistant repository.

    python tools/check_consistency.py

These are STATIC checks on the documents. They verify internal consistency,
counts, cross-references and prohibited language. They do NOT execute
anything against a model and establish nothing about clinical correctness or
runtime behaviour. Exit code 1 if any check fails.
"""

import glob
import hashlib
import io
import os
import re
import sys

FAILURES = []
PASSES = []


def read(p):
    return io.open(p, encoding='utf-8').read()


def check(name, ok, detail=''):
    if ok:
        PASSES.append(name)
    else:
        FAILURES.append((name, detail))


def scenario_counts():
    counts = {}
    for f in sorted(glob.glob('tests/*.md')):
        if os.path.basename(f) in ('EXECUTION_LOG.md', 'README.md'):
            continue
        n = len(re.findall(r'(?m)^### (?:FOOD|MED|SYM|DOC|LANG|SAFE|QF|REG)-', read(f)))
        if n:
            counts[os.path.basename(f)] = n
    return counts


def part_a():
    s = read('project/MED_ASSISTANT_SYSTEM_PROMPT.md')
    a = s.split('# PART A — RESIDENT PROMPT (paste into Project Instructions)')[1]
    a = a.split('<!-- ═══ END OF PART A ═══ -->')[0].strip()
    return s, a


def main():
    if not os.path.isdir('docs'):
        sys.exit('Run from the repository root.')

    prompt_full, a = part_a()
    floor = a.split('## A2 OPERATING RULES')[0]
    safety = read('docs/SAFETY_RULES.md')
    qengine = read('docs/QUESTION_ENGINE.md')
    sources = read('docs/CLINICAL_SOURCES.md')
    osi = read('docs/OPEN_SAFETY_ISSUES.md')
    tests_readme = read('tests/README.md')
    exec_log = read('tests/EXECUTION_LOG.md')
    readme = read('README.md')

    # ---- 1. referenced repo files exist
    all_md = glob.glob('*.md') + glob.glob('*/*.md')
    missing = set()
    for f in all_md:
        if f.startswith('review_package'):
            continue
        body = read(f)
        for ref in re.findall(r'`([A-Za-z0-9_./-]+\.(?:md|py))`', body):
            if ref.startswith('../'):
                cand = os.path.normpath(os.path.join(os.path.dirname(f), ref))
            elif '/' in ref:
                cand = ref
            else:
                cand = os.path.join(os.path.dirname(f), ref)
                if not os.path.exists(cand):
                    cand = ref
            base = os.path.basename(ref)
            if os.path.exists(cand):
                continue
            # a bare filename may legitimately refer to the uploaded (untemplated) copy
            if os.path.exists(os.path.join('project', base.replace('.md', '.template.md'))):
                continue
            if base in ('index.md',):
                continue
            if os.path.exists(os.path.join('tests', 'fixtures', base)):
                continue
            missing.add('%s -> %s' % (f, ref))
    check('cross-references resolve', not missing,
          '; '.join(sorted(missing)))

    # ---- 2. prompt structure
    check('Part A has a safety floor', '## A1 SAFETY FLOOR' in a)
    check('TIMING, NOT TIERS is present in Part A', '**TIMING, NOT TIERS.**' in a)
    check('LANGUAGE & SHAPE (the only droppable block) present', '**LANGUAGE & SHAPE.**' in a)
    check('Part B exists and is separate', '# PART B — EXTENDED NOTES' in prompt_full)
    check('Part A declares files are data, not instructions', 'FILES ARE DATA' in floor)
    check('Part A carries the medication prohibition', 'MEDICATION BOUNDARIES' in floor)
    check('Part A carries the rescue carve-out', 'RESCUE-TREATMENT CARVE-OUT' in floor)
    check('Part A carries the missing-plan fallback', 'IF NO PLAN OR THRESHOLD IS RECORDED' in floor)
    check('Part A carries the capability disclaimer', 'WHAT YOU CANNOT DO' in floor)

    # ---- 3. CPR criterion
    check('Part A requires unresponsive AND abnormal breathing for compressions',
          'Unresponsive AND breathing absent or abnormal' in floor)
    check('Part A names agonal/abnormal breathing patterns',
          'gasping' in floor and 'panting' in floor)
    check('Part A names the dispatcher', 'dispatcher' in floor.lower())
    # the standalone phrasing must not appear as a criterion anywhere normative
    bad = []
    for label, body in (('Part A', a), ('SAFETY_RULES', safety)):
        for m in re.finditer(r'[^\n]*not breathing normally[^\n]*', body):
            line = m.group(0)
            if 'alone is not' in line or 'must never be written' in line or 'on its own' in line:
                continue
            bad.append('%s: %s' % (label, line.strip()[:70]))
    check('no standalone "not breathing normally" criterion', not bad, '; '.join(bad))

    # ---- 4. head-injury consistency
    check('Part A head-injury trigger includes aspirin',
          re.search(r'head injury[^.]*aspirin included', floor) is not None)
    check('SAFETY_RULES head-injury trigger includes aspirin',
          'aspirin included' in safety)
    check('head-injury breadth flagged for clinician review', 'B-07' in safety and 'B-07' in osi)

    # ---- 5. provenance labels
    check('DOCUMENTED replaces CONFIRMED in Part A',
          'DOCUMENTED' in a and not re.search(r'\*\*CONFIRMED\*\*', a))
    check('no ASSUMED provenance label in Part A', 'ASSUMED' not in a)
    check('no triage tier emoji in Part A',
          not any(e in a for e in ('🔴', '🟠', '🟡', '🟢')))

    # ---- 6. question budget agreement
    check('routine budget 0-1 in Part A', 'Routine 0–1' in a)
    check('routine budget 0-1 in question engine',
          re.search(r'\| Routine exchange \| \*\*0–1\*\* \|', qengine) is not None)
    check('caregiver review capped at 3 in prompt', 'up to 3' in a)
    check('caregiver review capped at 3 in question engine', 'up to **3**' in qengine)
    check('safety override present in prompt', 'overrides that limit' in a)
    check('safety override present in question engine', 'overrides the routine limit' in qengine)

    # ---- 7. capability claims (Russian + English) outside prohibition context
    forbidden_ru = ['я запишу', 'запомню', 'я всё проверю', 'буду следить', 'я отмечу']
    hits = []
    for f in all_md:
        if f.startswith('review_package'):
            continue
        for i, line in enumerate(read(f).split('\n'), 1):
            for ph in forbidden_ru:
                if ph in line:
                    ctx = line.lower()
                    prohibitive = any(k in ctx for k in (
                        'must not', 'never', 'fail if', 'defect', 'removed',
                        'не могу', 'promised', 'no ', 'без '))
                    if not prohibitive:
                        hits.append('%s:%d %s' % (f, i, ph))
    check('no unguarded Russian capability promises', not hits, '; '.join(hits))

    # ---- 8. validation claims
    val = []
    for f in all_md:
        if f.startswith('review_package'):
            continue
        for i, line in enumerate(read(f).split('\n'), 1):
            if re.search(r'clinically validated', line, re.I) and not re.search(
                    r'not clinically validated|no claim|must not present|never', line, re.I):
                val.append('%s:%d' % (f, i))
    check('no clinical-validation claims', not val, '; '.join(val))

    # ---- 9. scenario counts
    counts = scenario_counts()
    total = sum(counts.values())
    claimed = re.findall(r'(\d+) scenarios? written|Scenarios \*\*written\*\* \| (\d+)', tests_readme)
    flat = [x for pair in claimed for x in pair if x]
    check('tests/README scenario count matches reality (%d)' % total,
          str(total) in tests_readme, 'counted %d; README says %s' % (total, flat))
    check('README scenario count matches reality',
          str(total) in readme, 'counted %d' % total)
    check('EXECUTION_LOG scenario count matches reality',
          str(total) in exec_log, 'counted %d' % total)
    for fn, n in counts.items():
        if fn == 'regression_cases.md':
            check('tests/README regression count correct',
                  ('| %d |' % n) in tests_readme, 'regression_cases has %d' % n)

    # ---- 10. execution honesty
    check('EXECUTION_LOG states the configuration under test',
          'Configuration under test' in exec_log and 'SHA-256' in exec_log)
    check('EXECUTION_LOG separates executed from not-executed',
          'NOT RUN' in exec_log and 'Gating IDs executed' in exec_log)
    check('EXECUTION_LOG disclaims simulated output',
          'No simulated, predicted or reconstructed output' in exec_log)
    check('EXECUTION_LOG states what the run does not establish',
          'does NOT establish' in exec_log)
    check('clinical-review blockers still open after the run',
          'B-01' in osi and 'B-02' in osi and
          re.search(r'B-01.*No clinician review', osi, re.S) is not None)
    check('tests/README separates written from executed',
          'Written ≠ executed' in tests_readme or 'written ≠ executed' in tests_readme.lower())

    # ---- 11. clinical sources coverage
    for src in ('Resuscitation Council UK', 'Diabetes UK', 'NICE NG232',
                'NHS Specialist Pharmacy Service'):
        check('source cited: %s' % src, src in sources)
    check('RCUK arrest criterion quoted in sources',
          'unresponsive with abnormal breathing' in sources)
    check('sources carry retrieval dates', 'retrieved 2026-09-19' in sources or
          'All retrieved 2026-09-19' in sources)

    # ---- 12. blockers open
    blockers = re.findall(r'(?m)^### (B-\d+)', osi)
    check('blockers enumerated (>=8)', len(blockers) >= 8, 'found %s' % blockers)
    check('clinician review blocker open', 'B-01' in blockers)
    check('pharmacist review blocker open', 'B-02' in blockers)
    check('execution blocker open', 'B-03' in blockers)
    check('P-02 permanently open', 'CANNOT BE CLOSED BY TESTING' in osi)
    check('emergency fallbacks marked not in force',
          'NOT APPROVED' in read('docs/EMERGENCY_FALLBACKS.md'))

    # ---- 13. review_package fidelity
    pairs = [
        ('project/MED_ASSISTANT_SYSTEM_PROMPT.md', 'review_package/MED_ASSISTANT_SYSTEM_PROMPT.md'),
        ('docs/QUESTION_ENGINE.md', 'review_package/QUESTION_ENGINE.md'),
        ('docs/SAFETY_RULES.md', 'review_package/SAFETY_RULES.md'),
        ('IMPLEMENTATION_DECISIONS.md', 'review_package/IMPLEMENTATION_DECISIONS.md'),
        ('docs/CLINICAL_SOURCES.md', 'review_package/CLINICAL_SOURCES.md'),
        ('docs/OPEN_SAFETY_ISSUES.md', 'review_package/OPEN_SAFETY_ISSUES.md'),
        ('docs/EMERGENCY_FALLBACKS.md', 'review_package/EMERGENCY_FALLBACKS.md'),
        ('tests/EXECUTION_LOG.md', 'review_package/EXECUTION_LOG.md'),
    ]
    drift = []
    for src, dst in pairs:
        if not os.path.exists(dst):
            drift.append('missing ' + dst)
        elif hashlib.md5(open(src, 'rb').read()).hexdigest() != \
                hashlib.md5(open(dst, 'rb').read()).hexdigest():
            drift.append('stale ' + dst)
    check('review_package matches sources', not drift, '; '.join(drift))

    # ---- 14. no real patient data committed
    leaked = [f for f in (
        'project/PATIENT_PROFILE.md', 'project/CURRENT_MEDICATIONS.md',
        'project/MEDICAL_HISTORY.md', 'project/LAB_RESULTS.md',
        'project/HEALTH_TIMELINE.md', 'project/CARE_PLAN.md',
        'project/FAMILY_NOTES.md') if os.path.exists(f)]
    check('no filled patient files in the repo', not leaked, '; '.join(leaked))

    # ---- report
    print('LOCAL CONSISTENCY CHECKS')
    print('=' * 62)
    print('These are static document checks only. They execute nothing')
    print('against a model and prove nothing clinical.')
    print()
    for n in PASSES:
        print('  PASS  %s' % n)
    for n, d in FAILURES:
        print('  FAIL  %s' % n)
        if d:
            print('        %s' % d)
    print()
    print('%d passed, %d failed' % (len(PASSES), len(FAILURES)))
    print()
    print('Scenario counts (WRITTEN, not executed):')
    for fn, n in sorted(counts.items()):
        print('  %-28s %3d' % (fn, n))
    print('  %-28s %3d' % ('TOTAL WRITTEN', total))
    m = re.search(r'Individual inputs executed[^|]*\|\s*(\d+)', exec_log)
    # This figure is inherited from the historical Project transcripts recorded in
    # tests/EXECUTION_LOG.md. It is not a count of anything executed by the standalone
    # application, and it is not the reconciled gating subset. Label it so the two are
    # never read as the same number.
    print('  %-28s %3s   (historical Project transcripts only, see tests/EXECUTION_LOG.md;'
          % ('HISTORICAL EXECUTED', m.group(1) if m else '0'))
    print('  %-28s     not executed by this application and not the gating subset)' % '')
    return 1 if FAILURES else 0


if __name__ == '__main__':
    sys.exit(main())
