# EXECUTION LOG — ACTUAL RUNS ONLY

This file records **what a model actually produced**. It is separate from the scenario files on purpose: those hold predictions, this holds evidence.

## Current state

| | |
|---|---|
| Scenarios written | 79 |
| **Scenarios executed** | **0** |
| **Runs recorded below** | **0** |
| Date of first execution | — |

**Nothing has been run.** No entry exists below because no model output has ever been observed against this prompt.

Do not cite the scenario count as testing. Do not describe the suite as "passing". Until a row exists here with a preserved output, the only honest statement is that the system is untested.

---

## How to record a run

One row per scenario per run. A run without its verbatim output is not recorded — a summary of what the model "basically did" is not evidence.

```
### <SCENARIO ID> — run <N>

Date:            YYYY-MM-DD
Model / plan:    e.g. GPT-5 Thinking, Plus
Prompt version:  e.g. v0.3, Part A resident, LANGUAGE & SHAPE dropped / not dropped
Project files:   which of the seven were uploaded, and their dates
Input:           verbatim, including language
Output:          verbatim, complete, not summarised
Verdict:         PASS / FAIL / PARTIAL
Which "must not" were violated, if any:
Notes:
```

A `PARTIAL` is a `FAIL` for anything in `regression_cases.md` or `safety_cases.md`.

## Re-running after a change

Any edit to Part A invalidates every prior run of every scenario. Record the prompt version on every row, and re-run at least `regression_cases.md` after any Part A change.

## What a passing run does and does not establish

**Does:** that the prompt produced the intended behaviour on that input, on that model, on that day.

**Does not:**
- clinical correctness — that is blockers `B-01` and `B-02`, and no amount of execution substitutes for it;
- reliability of file retrieval (`P-02`) or of project memory (`P-03`) — a behaviour observed once is not a behaviour guaranteed, and both issues stay permanently open;
- safety on inputs not in the suite;
- anything at all about voice input, which has its own blocker (`B-08`).

---

## Runs

*(none)*
