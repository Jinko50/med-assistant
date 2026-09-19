#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Measure the system prompt's parts.

    python tools/measure_prompt.py

Character counts here are what you compare against the project Instructions
field's real capacity. That capacity is NOT published by OpenAI and must be
measured empirically -- see SETUP_CHATGPT_PROJECT.md Step 2. Do not infer it
from the account-level Custom Instructions limit; that is a different field.
"""

import io
import os
import sys

PROMPT = os.path.join('project', 'MED_ASSISTANT_SYSTEM_PROMPT.md')
PART_A = '# PART A — RESIDENT PROMPT (paste into Project Instructions)'
END_A = '<!-- ═══ END OF PART A ═══ -->'
PART_B = '# PART B — EXTENDED NOTES'
A2 = '## A2 OPERATING RULES'
DROPPABLE = '**LANGUAGE & SHAPE.**'


def main():
    if not os.path.exists(PROMPT):
        sys.exit('Run this from the repository root; %s not found.' % PROMPT)

    text = io.open(PROMPT, encoding='utf-8').read()
    try:
        part_a = text.split(PART_A)[1].split(END_A)[0].strip()
        part_b = text.split(PART_B)[1].strip()
    except IndexError:
        sys.exit('Could not find the Part A / Part B markers. Has the file been restructured?')

    floor = part_a.split(A2)[0].strip()
    rules = part_a[len(floor):].strip()

    droppable = [p for p in part_a.split('\n\n') if p.startswith(DROPPABLE)]
    drop_len = len(droppable[0]) + 2 if droppable else 0

    print('Part A (paste into Instructions) : %5d characters' % len(part_a))
    print('  A1 safety floor                : %5d   never drop any of this' % len(floor))
    print('  A2 operating rules             : %5d' % len(rules))
    print('Part B (upload as a file)        : %5d characters' % len(part_b))
    print()
    if drop_len:
        print('Only permitted reduction: drop the LANGUAGE & SHAPE paragraph')
        print('  saves %d chars  ->  Part A would be %d' % (drop_len, len(part_a) - drop_len))
    else:
        print('WARNING: the droppable LANGUAGE & SHAPE paragraph was not found.')
    print()
    print('TIMING, NOT TIERS is safety content and must never be dropped.')
    print('If Part A does not fit after the one permitted drop, stop -- do not')
    print('run the pilot on that plan.')
    print()
    print('The project Instructions field capacity is UNKNOWN. Measure it:')
    print('  1. paste Part A, save, close the project, reopen it')
    print('  2. confirm the final line is still the TIMING, NOT TIERS paragraph')
    print('  3. record what you found in docs/OPEN_SAFETY_ISSUES.md P-01')


if __name__ == '__main__':
    main()
